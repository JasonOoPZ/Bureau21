import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Character } from '@/types/game';
import { GAME } from '@/lib/constants';

interface District {
  name: string;
  href: string;
  icon: string;
  description: string;
  unlockLevel?: number;
  color: string;
}

const districts: District[] = [
  {
    name: 'Hydroponics',
    href: '/station/hydroponics',
    icon: '🌿',
    description: 'Pick alien herbs for healing and trade.',
    color: 'border-emerald-700 hover:border-emerald-500',
  },
  {
    name: 'Bazaar',
    href: '/station/bazaar',
    icon: '🛒',
    description: 'Buy and sell gear, weapons, and supplies.',
    unlockLevel: GAME.UNLOCK_BAZAAR,
    color: 'border-amber-700 hover:border-amber-500',
  },
  {
    name: 'Syndicate Row',
    href: '/station/syndicate-row',
    icon: '🤝',
    description: 'Join or form a syndicate. Visit the bank.',
    unlockLevel: GAME.UNLOCK_SYNDICATE,
    color: 'border-purple-700 hover:border-purple-500',
  },
  {
    name: 'The Core',
    href: '/station/the-core',
    icon: '⚙️',
    description: 'The power center of Bureau 21. Mysterious.',
    unlockLevel: GAME.UNLOCK_FULL,
    color: 'border-cyan-700 hover:border-cyan-500',
  },
  {
    name: 'Armory',
    href: '/station/armory',
    icon: '🔫',
    description: 'Heavy weaponry and armor for serious operators.',
    unlockLevel: GAME.UNLOCK_FULL,
    color: 'border-red-700 hover:border-red-500',
  },
  {
    name: 'Underbelly',
    href: '/station/underbelly',
    icon: '🕵️',
    description: 'Black market. Illegal substances. High risk.',
    unlockLevel: GAME.UNLOCK_UNDERBELLY,
    color: 'border-red-900 hover:border-red-700',
  },
];

export default async function StationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: character } = await supabase
    .from('characters')
    .select('level, username')
    .eq('user_id', user.id)
    .single();

  if (!character) redirect('/signup');

  const char = character as Pick<Character, 'level' | 'username'>;

  return (
    <div className="p-4 md:p-6 max-w-4xl">
      <div className="border-b border-slate-700 pb-4 mb-6">
        <h1 className="text-2xl font-bold text-amber-500">🚉 Bureau 21 Station</h1>
        <p className="text-slate-400 text-sm mt-1">
          Navigate the districts of the free port.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {districts.map((d) => {
          const locked = d.unlockLevel !== undefined && char.level < d.unlockLevel;
          return (
            <div key={d.name}>
              {locked ? (
                <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-5 opacity-60 cursor-not-allowed">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl grayscale">{d.icon}</span>
                    <div>
                      <h2 className="text-slate-400 font-semibold">{d.name}</h2>
                      <p className="text-slate-500 text-xs">
                        🔒 Requires Level {d.unlockLevel}
                      </p>
                    </div>
                  </div>
                  <p className="text-slate-500 text-sm">{d.description}</p>
                </div>
              ) : (
                <Link
                  href={d.href}
                  className={`block bg-slate-800 border-2 ${d.color} rounded-lg p-5 transition-colors group min-h-[48px]`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{d.icon}</span>
                    <h2 className="text-slate-200 font-semibold group-hover:text-white">
                      {d.name}
                    </h2>
                  </div>
                  <p className="text-slate-400 text-sm group-hover:text-slate-300">
                    {d.description}
                  </p>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
