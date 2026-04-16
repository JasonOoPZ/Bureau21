import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Bureau 21 — Free Port · Deep Space',
  description: 'A browser-first sci-fi MMORPG on a lawless space station.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        ) : (
          <main className="min-h-screen">{children}</main>
        )}
      </body>
    </html>
  );
}
