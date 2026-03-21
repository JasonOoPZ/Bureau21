import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Item } from '@/types/game';

export default async function BazaarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: items } = await supabase
    .from('items')
    .select('*')
    .in('type', ['weapon', 'armor', 'consumable'])
    .order('buy_price', { ascending: true });

  const rarityColor: Record<string, string> = {
    common: 'text-slate-400',
    uncommon: 'text-emerald-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-amber-400',
  };

  const typeIcon: Record<string, string> = {
    weapon: '⚔️',
    armor: '🛡',
    consumable: '💊',
    herb: '🌿',
    misc: '📦',
    substance: '🧪',
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">🛒 Bazaar</h1>
        <p className="text-slate-400 text-sm mt-1">
          Gear up for the battles ahead.
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
                className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span>{typeIcon[i.type] ?? '📦'}</span>
                    <h3 className="text-slate-200 font-semibold">{i.name}</h3>
                  </div>
                  <span className={`text-xs capitalize ${rarityColor[i.rarity] ?? 'text-slate-400'}`}>
                    {i.rarity}
                  </span>
                </div>
                <p className="text-slate-400 text-xs mt-1">{i.description}</p>
                <div className="flex gap-3 mt-2 text-xs">
                  {i.atk_bonus > 0 && <span className="text-red-400">+{i.atk_bonus} ATK</span>}
                  {i.def_bonus > 0 && <span className="text-blue-400">+{i.def_bonus} DEF</span>}
                  {i.heal_amount > 0 && <span className="text-emerald-400">+{i.heal_amount} LF</span>}
                  {i.level_req > 1 && <span className="text-slate-500">Lv {i.level_req}+</span>}
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-amber-400 font-bold text-sm">
                    💰 {i.buy_price.toLocaleString()}
                  </span>
                  <span className="text-slate-500 text-xs">
                    Sell: {i.sell_price.toLocaleString()}
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
