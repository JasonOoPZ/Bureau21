import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Item } from '@/types/game';

export default async function ArmoryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .in('type', ['weapon', 'armor'])
    .gte('level_req', 8)
    .order('level_req', { ascending: true });

  const rarityColor: Record<string, string> = {
    common: 'text-slate-400',
    uncommon: 'text-emerald-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-amber-400',
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-red-400">🔫 Armory</h1>
        <p className="text-slate-400 text-sm mt-1">
          Heavy weapons and armor. Serious operators only.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {!items || items.length === 0 ? (
          <p className="text-slate-400">No items available.</p>
        ) : (
          items.map((item) => {
            const i = item as Item;
            return (
              <div
                key={i.id}
                className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-red-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-slate-200 font-semibold">
                    {i.type === 'weapon' ? '⚔️' : '🛡'} {i.name}
                  </h3>
                  <span className={`text-xs capitalize ${rarityColor[i.rarity] ?? 'text-slate-400'}`}>
                    {i.rarity}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">{i.description}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  {i.atk_bonus > 0 && <span className="text-red-400">+{i.atk_bonus} ATK</span>}
                  {i.def_bonus > 0 && <span className="text-blue-400">+{i.def_bonus} DEF</span>}
                  <span className="text-slate-500">Lv {i.level_req}+</span>
                </div>
                <div className="mt-3">
                  <span className="text-amber-400 font-bold text-sm">
                    💰 {i.buy_price.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
