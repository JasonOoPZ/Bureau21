'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/house', label: '🏠 Quarters' },
  { href: '/station', label: '🚉 Station' },
  { href: '/gym', label: '💪 Gym' },
  { href: '/battle', label: '⚔️ Battle' },
  { href: '/boards', label: '📋 Boards' },
  { href: '/chat', label: '💬 Chat' },
  { href: '/leaderboard', label: '🏆 Leaderboard' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside className="w-56 min-h-screen bg-slate-800 border-r border-slate-700 flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h1 className="text-amber-500 font-bold text-xl tracking-wider">
          BUREAU 21
        </h1>
        <p className="text-slate-400 text-xs mt-1">Free Port · Deep Space</p>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`block px-3 py-2 rounded text-sm transition-colors min-h-[48px] flex items-center ${
              pathname === href || pathname.startsWith(href + '/')
                ? 'bg-amber-500 text-slate-900 font-semibold'
                : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full px-3 py-2 bg-slate-700 hover:bg-red-900 text-slate-300 hover:text-red-200 rounded text-sm transition-colors min-h-[48px]"
        >
          🚪 Logout
        </button>
      </div>
    </aside>
  );
}
