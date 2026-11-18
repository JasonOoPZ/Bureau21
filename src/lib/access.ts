import { createHash } from "crypto";

/**
 * Pure access rules shared by the NextAuth callbacks, the admin routes and
 * `requireUser`. No database or Next imports, so it is safe anywhere.
 */

export const ADMIN_ROLE = "admin";

/**
 * A suspended account is locked out, except admins. Admins are exempt so a
 * stray `suspended` flag can never lock the last operator out; to ban an
 * admin, demote them first (the admin routes enforce that order).
 */
export function isAccessBlocked(user: { role: string; suspended: boolean }): boolean {
  return user.suspended && user.role !== ADMIN_ROLE;
}

/**
 * Short fingerprint of the stored password hash. It is copied into the JWT at
 * sign-in; when the password changes the fingerprints stop matching and every
 * older session dies. Needs no schema change.
 */
export function passwordFingerprint(hashedPassword: string | null | undefined): string {
  return createHash("sha256").update(hashedPassword ?? "").digest("hex").slice(0, 16);
}
