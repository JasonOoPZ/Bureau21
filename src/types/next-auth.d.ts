import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      suspended: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    suspended?: boolean;
    /** Account deleted, or password changed since this token was issued. */
    revoked?: boolean;
    /** Fingerprint of the password hash at sign-in. */
    pwv?: string;
  }
}
