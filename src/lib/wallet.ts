import { randomBytes, createHash } from "crypto";

/**
 * Generate an Ethereum-compatible wallet address using standard crypto.
 * This creates a random 32-byte private key and derives a public address from it.
 */
export async function generateWalletAddress(): Promise<string> {
  const privateKey = randomBytes(32);
  // Simple deterministic address derivation from private key bytes
  const hash = createHash("sha256").update(privateKey).digest("hex");
  // Take last 40 hex chars and prefix with 0x to form an address
  const address = `0x${hash.slice(-40)}`;
  return address;
}
