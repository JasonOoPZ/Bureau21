import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Syndicate } from '@/types/game';

export default async function GuildsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: syndicates } = await supabase
    .from('syndicates')
    .select('*, created_by:characters!syndicates_created_by_fkey(username)')
    .order('treasury', { ascending: false })
    .limit(20);

  const { data: character } = await supabase
    .from('characters')
    .select('id, syndicate_id')
    .eq('user_id', user.id)
    .single();

  return (
    <div className="p-4 md:p-6 max-w-3xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-purple-400">⚡ Syndicates</h1>
        <p className="text-slate-400 text-sm mt-1">
          Join a syndicate for motivation bonuses and prestige.
        </p>
      </div>

      {character?.syndicate_id && (
        <div className="bg-purple-900/30 border border-purple-700 rounded-lg p-3 text-purple-300 text-sm">
          You are a member of a syndicate. Leave to join another.
        </div>
      )}

      <div className="space-y-3">
        {!syndicates || syndicates.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center text-slate-400">
            No syndicates yet. Be the first to form one.
          </div>
        ) : (
          syndicates.map((s) => {
            const syn = s as Syndicate & { created_by: { username: string } | null };
            return (
              <div
                key={s.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-slate-200 font-bold">{s.name}</h3>
                  <span className="text-amber-400 text-sm">
                    💰 {s.treasury.toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">
                  Founded by{' '}
                  <span className="text-amber-300">{syn.created_by?.username ?? 'Unknown'}</span>
                </p>
                {s.description && (
                  <p className="text-slate-300 text-sm mt-2">{s.description}</p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
