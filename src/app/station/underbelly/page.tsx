import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function UnderbellyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: character } = await supabase
    .from('characters')
    .select('level')
    .eq('user_id', user.id)
    .single();

  if (!character || character.level < 8) redirect('/station');

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="border-b border-red-900 pb-4">
        <h1 className="text-2xl font-bold text-red-400">🕵️ The Underbelly</h1>
        <p className="text-slate-400 text-sm mt-1">
          Black market. No questions asked. High risk, high reward.
        </p>
      </div>

      <div className="bg-red-900/20 border border-red-800 rounded-lg p-6 space-y-4">
        <div className="text-4xl text-center">🕵️</div>
        <p className="text-red-300 text-sm text-center">
          The Underbelly deals in substances, stolen goods, and off-the-books
          contracts. Recipe discovery coming soon.
        </p>
        <div className="text-slate-500 text-xs text-center">
          ⚠️ Trading here may affect your alignment. Proceed with caution.
        </div>
      </div>
    </div>
  );
}
