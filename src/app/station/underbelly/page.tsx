import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const GAMES = [
  {
    href: '/station/underbelly/crash',
    icon: '🚀',
    name: 'Crash',
    tagline: 'Ride the rocket. Cash out before it explodes.',
    badge: 'DEGEN',
    badgeColor: 'bg-red-600',
    odds: 'Up to 100x',
  },
  {
    href: '/station/underbelly/slots',
    icon: '🎰',
    name: 'Slots',
    tagline: 'Three reels. One jackpot. Pure chaos.',
    badge: 'JACKPOT',
    badgeColor: 'bg-amber-600',
    odds: 'Up to 50x',
  },
  {
    href: '/station/underbelly/blackjack',
    icon: '🃏',
    name: 'Blackjack',
    tagline: 'Beat the dealer. Skill meets fortune.',
    badge: 'SKILL',
    badgeColor: 'bg-emerald-700',
    odds: '2.5x BJ',
  },
  {
    href: '/station/underbelly/dice',
    icon: '🎲',
    name: 'Dice Pit',
    tagline: 'Roll over, under, or hit the magic seven.',
    badge: 'FAST',
    badgeColor: 'bg-cyan-700',
    odds: 'Up to 4x',
  },
  {
    href: '/station/underbelly/coin-flip',
    icon: '🪙',
    name: 'Coin Flip',
    tagline: 'Double or nothing. No strategy needed.',
    badge: 'SIMPLE',
    badgeColor: 'bg-slate-600',
    odds: '1.95x',
  },
];

export default async function UnderbellyPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: character } = await supabase
    .from('characters')
    .select('level, credits_hand')
    .eq('user_id', user.id)
    .single();

  if (!character || character.level < 8) redirect('/station');

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="border-b border-red-900 pb-4">
        <h1 className="text-2xl font-bold text-red-400">🕵️ The Underbelly — Casino</h1>
        <p className="text-slate-400 text-sm mt-1">
          No corp oversight. No limits. All in-station credits. Enter at your own risk.
        </p>
        <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
          <span>💳 On hand:</span>
          <span className="text-amber-400 font-bold font-mono">{character.credits_hand.toLocaleString()} ₡</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {GAMES.map((game) => (
          <Link
            key={game.href}
            href={game.href}
            className="bg-slate-800 border border-slate-700 hover:border-red-700 rounded-xl p-5 flex gap-4 items-start transition-all group"
          >
            <div className="text-4xl">{game.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-slate-100 font-bold group-hover:text-red-300 transition-colors">
                  {game.name}
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded font-bold text-white ${game.badgeColor}`}>
                  {game.badge}
                </span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">{game.tagline}</p>
              <div className="mt-2 text-amber-400 text-xs font-bold">{game.odds}</div>
            </div>
            <div className="text-slate-600 group-hover:text-red-500 text-xl transition-colors">→</div>
          </Link>
        ))}
      </div>

      <div className="bg-red-900/10 border border-red-900/40 rounded-lg p-4 text-xs text-slate-500 space-y-1">
        <p>⚠️ <span className="text-red-400 font-semibold">House Warning:</span> The Underbelly takes a cut on every game. Credits lost here are gone for good.</p>
        <p>All games use credits on hand only. Bank your credits before visiting if you want to keep them.</p>
        <p className="text-slate-600">More games coming: Poker, Roulette, Sports Books.</p>
      </div>
    </div>
  );
}
