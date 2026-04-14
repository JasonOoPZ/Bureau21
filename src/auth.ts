import { type NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { generateWalletAddress } from "@/lib/wallet";

const providers: Array<ReturnType<typeof Credentials> | ReturnType<typeof Google>> = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email = credentials?.email;
      const password = credentials?.password;

      if (!email || !password) {
        return null;
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
        },
      });

      if (!user?.hashedPassword) {
        return null;
      }

      if (user.suspended) {
        return null;
      }

      const isValid = await bcrypt.compare(password, user.hashedPassword);

      if (!isValid) {
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
          select: { suspended: true, walletAddress: true },
        });

        if (dbUser?.suspended) {
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
    async jwt({ token, user }) {
      if (user?.id) {
        token.sub = user.id;
      }

      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { role: true, suspended: true },
        });

        token.role = dbUser?.role ?? "player";
        token.suspended = dbUser?.suspended ?? false;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.role = (token.role as string) ?? "player";
        session.user.suspended = Boolean(token.suspended);
      }

      return session;
    },
  },
};
