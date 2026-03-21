import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function TheCorePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-cyan-400">⚙️ The Core</h1>
        <p className="text-slate-400 text-sm mt-1">
          The beating heart of Bureau 21. Systems beyond comprehension.
        </p>
      </div>

      <div className="bg-slate-800 rounded-lg border border-cyan-800 p-8 text-center space-y-4">
        <div className="text-6xl animate-pulse">⚙️</div>
        <p className="text-cyan-300 font-semibold">Core Systems Online</p>
        <p className="text-slate-400 text-sm">
          The Core manages Bureau 21&apos;s life support, power distribution, and data
          networks. Access to advanced systems unlocks at higher levels.
        </p>
        <div className="text-slate-600 text-xs">
          [CLASSIFIED — Level 15+ clearance required for full access]
        </div>
      </div>
    </div>
  );
}
