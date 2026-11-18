import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { isAccessBlocked, passwordFingerprint } from "@/lib/access";
import { provisionPilot } from "@/lib/pilot-provision";
import { prisma } from "@/lib/prisma";
import { clientIp, isRateLimited, recordRateLimitHit } from "@/lib/rate-limit";
import { generateWalletAddress } from "@/lib/wallet";

/** Failed credential sign-ins allowed per window before the key is locked. */
const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_FAILURES_PER_IP_EMAIL = 8;
const LOGIN_MAX_FAILURES_PER_IP = 40;
const LOGIN_RATE_LIMIT_ERROR = "TooManyAttempts";

function loginLimitKeys(ip: string, email: string) {
  return [
    { key: `login:ip-email:${ip}:${email}`, max: LOGIN_MAX_FAILURES_PER_IP_EMAIL },
    { key: `login:ip:${ip}`, max: LOGIN_MAX_FAILURES_PER_IP },
  ];
}

async function isLoginLocked(ip: string, email: string): Promise<boolean> {
  try {
    const states = await Promise.all(
      loginLimitKeys(ip, email).map(({ key, max }) => isRateLimited(key, max, LOGIN_WINDOW_MS))
    );
    return states.some((state) => state.limited);
  } catch (error) {
    // Limiter storage down: do not take sign-in down with it.
    console.error("[auth] login rate-limit check failed", error);
    return false;
  }
}

async function recordLoginFailure(ip: string, email: string): Promise<void> {
  try {
    await Promise.all(loginLimitKeys(ip, email).map(({ key }) => recordRateLimitHit(key, LOGIN_WINDOW_MS)));
  } catch (error) {
    console.error("[auth] could not record failed login", error);
  }
}

const providers: Array<ReturnType<typeof Credentials> | ReturnType<typeof Google>> = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials, req) {
      const email = credentials?.email?.trim();
      const password = credentials?.password;

      if (!email || !password) {
        return null;
      }

      const ip = clientIp(req?.headers);
      const limiterEmail = email.toLowerCase();
      if (await isLoginLocked(ip, limiterEmail)) {
        throw new Error(LOGIN_RATE_LIMIT_ERROR);
      }

      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
          hashedPassword: true,
          suspended: true,
          role: true,
        },
      });

      // Only failures count against the limit, so a real user is never
      // throttled by their own successful sign-ins.
      if (!user?.hashedPassword) {
        await recordLoginFailure(ip, limiterEmail);
        return null;
      }

      const isValid = await bcrypt.compare(password, user.hashedPassword);

      if (!isValid) {
        await recordLoginFailure(ip, limiterEmail);
        return null;
      }

      if (isAccessBlocked(user)) {
        return null;
      }

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  secret: process.env.NEXTAUTH_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/",
  },
  callbacks: {
    async signIn({ user, account }) {
      if (!user?.id) {
        return false;
      }

      if (account?.provider === "google" || account?.provider === "credentials") {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { suspended: true, role: true, walletAddress: true },
        });

        if (dbUser && isAccessBlocked(dbUser)) {
          return false;
        }

        if (!dbUser?.walletAddress) {
          try {
            const walletAddress = await generateWalletAddress();
            await prisma.user.update({
              where: { id: user.id },
              data: { walletAddress },
            });
          } catch {
            // Wallet generation is non-critical; don't block sign-in
          }
        }
      }

      return true;
    },
    /*
     * Runs on EVERY getServerSession() / useSession() call, not only at
     * sign-in (next-auth v4 core/routes/session.js calls callbacks.jwt for each
     * session read with the JWT strategy). So this one primary-key lookup is
     * the central place where an account's standing is checked: a suspension,
     * deletion or password change takes effect on the user's next request.
     */
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (!token.sub) {
        return token;
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: { name: true, role: true, suspended: true, hashedPassword: true },
      });

      if (!dbUser) {
        token.role = "player";
        token.suspended = false;
        token.revoked = true;
        return token;
      }

      const fingerprint = passwordFingerprint(dbUser.hashedPassword);
      // Stamp at sign-in. Tokens issued before this field existed adopt the
      // current fingerprint the first time they are seen.
      if (user || token.pwv === undefined) {
        token.pwv = fingerprint;
      }

      // The callsign can change (settings, appearance); never show a stale one.
      token.name = dbUser.name;
      token.role = dbUser.role;
      token.suspended = isAccessBlocked(dbUser);
      token.revoked = token.pwv !== fingerprint;

      return token;
    },
    async session({ session, token }) {
      // An empty session makes getServerSession() return null and useSession()
      // report "unauthenticated", so every existing `session?.user?.id` check
      // in the API routes and pages rejects the caller.
      if (!token.sub || token.suspended || token.revoked) {
        return {} as typeof session;
      }

      if (session.user) {
        session.user.id = token.sub;
        session.user.name = token.name;
        session.user.role = token.role ?? "player";
        session.user.suspended = false;
      }

      return session;
    },
  },
  events: {
    async createUser({ user }) {
      try {
        await provisionPilot(user.id, user.name);
      } catch (error) {
        // Non-fatal: the pilot is then created lazily on first game request.
        console.error("[auth] could not provision pilot for new user", error);
      }
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[next-auth][error]", code, JSON.stringify(metadata, null, 2));
    },
  },
};
