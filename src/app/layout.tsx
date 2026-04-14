import type { Metadata } from "next";
import { Orbitron, Space_Grotesk } from "next/font/google";
import { cookies } from "next/headers";
import { Providers } from "@/components/providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Bureau 21",
  description: "A browser-first sci-fi MMORPG",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("bureau21-theme")?.value ?? "original";

  return (
    <html lang="en" data-theme={theme === "original" ? undefined : theme}>
      <body className={`${spaceGrotesk.variable} ${orbitron.variable}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
