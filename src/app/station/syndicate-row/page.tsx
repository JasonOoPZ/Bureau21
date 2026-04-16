import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function SyndicateRowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-purple-400">🤝 Syndicate Row</h1>
        <p className="text-slate-400 text-sm mt-1">
          Power, loyalty, and underground banking on Bureau 21.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/station/syndicate-row/bank"
          className="block bg-slate-800 border-2 border-emerald-700 hover:border-emerald-500 rounded-lg p-6 transition-colors group"
        >
          <div className="text-3xl mb-2">🏦</div>
          <h2 className="text-slate-200 font-bold text-lg group-hover:text-white">
            Bureau Bank
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Deposit and withdraw credits. Keep your funds safe from raiders.
          </p>
        </Link>

        <Link
          href="/station/syndicate-row/guilds"
          className="block bg-slate-800 border-2 border-purple-700 hover:border-purple-500 rounded-lg p-6 transition-colors group"
        >
          <div className="text-3xl mb-2">⚡</div>
          <h2 className="text-slate-200 font-bold text-lg group-hover:text-white">
            Syndicates
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Join a syndicate for bonuses, backup, and prestige.
          </p>
        </Link>
      </div>
    </div>
  );
}
