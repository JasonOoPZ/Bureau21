import { createThirdwebClient } from "thirdweb";
import { privateKeyToAccount } from "thirdweb/wallets";
import { randomBytes } from "crypto";

const serverClient = createThirdwebClient({
  secretKey: process.env.THIRDWEB_SECRET_KEY!,
});

export async function generateWalletAddress(): Promise<string> {
  const privateKey = `0x${randomBytes(32).toString("hex")}`;
  const account = privateKeyToAccount({ client: serverClient, privateKey });
  return account.address;
}
