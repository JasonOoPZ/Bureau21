import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Message, BoardType } from '@/types/game';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';
import NewPostForm from '@/components/NewPostForm';

type BoardDef = {
  type: BoardType;
  label: string;
  icon: string;
  description: string;
};

type Section = {
  heading: string;
  subheading: string;
  accent: string;
  boards: BoardDef[];
};

const SECTIONS: Section[] = [
  {
    heading: '📡 Station Comms',
    subheading: 'Open channels — talk to anyone on the station',
    accent: 'border-cyan-700',
    boards: [
      {
        type: 'general',
        label: 'General Chatter',
        icon: '💬',
        description: 'Off-duty talk, rumours and station noise',
      },
      {
        type: 'operator_journals',
        label: 'Operator Journals',
        icon: '📖',
        description: 'Personal logs, faction stories and field reports',
      },
      {
        type: 'rookie_bay',
        label: 'Rookie Bay',
        icon: '🔰',
        description: 'New to Bureau 21? Ask the veterans anything',
      },
    ],
  },
  {
    heading: '⚙️ Operations',
    subheading: 'Mission intel, tactics and crew coordination',
    accent: 'border-amber-700',
    boards: [
      {
        type: 'announcements',
        label: 'Station Announcements',
        icon: '📢',
        description: 'Official broadcasts from Bureau Command — read before acting',
      },
      {
        type: 'tactics',
        label: 'Tactics & Strategy',
        icon: '⚔️',
        description: 'Combat builds, stat optimisation and mission walkthroughs',
      },
      {
        type: 'job_board',
        label: 'Job Board',
        icon: '📋',
        description: 'Contracts, bounties, crew recruitment and guild postings',
      },
    ],
  },
  {
    heading: '💱 Commerce',
    subheading: 'Trade, barter and backroom deals',
    accent: 'border-emerald-700',
    boards: [
      {
        type: 'trading',
        label: 'Trading Post',
        icon: '🛒',
        description: 'Buy, sell and swap gear with other operators',
      },
      {
        type: 'market_intel',
        label: 'Market Intel',
        icon: '📊',
        description: 'Price checks, supply disruptions and arbitrage tips',
      },
      {
        type: 'black_market',
        label: 'Black Market',
        icon: '🕶️',
        description: 'High-risk deals, contraband listings and off-record trades',
      },
    ],
  },
  {
    heading: '💎 Crypto & Finance',
    subheading: 'Credit markets, station tokens and degen yield plays',
    accent: 'border-violet-700',
    boards: [
      {
        type: 'credit_exchange',
        label: 'Credit Exchange',
        icon: '💰',
        description: 'In-station economy discussion, credit sink analysis and arbitrage',
      },
      {
        type: 'token_vault',
        label: 'Token Vault',
        icon: '🪙',
        description: 'Station tokens, staking strategies and passive income plays',
      },
      {
        type: 'syndicate_finance',
        label: 'Syndicate Finance',
        icon: '🏦',
        description: 'Guild treasury management, revenue splits and collective yield ops',
      },
    ],
  },
];

const ALL_BOARDS: BoardDef[] = SECTIONS.flatMap((s) => s.boards);

export default async function BoardsPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const params = await searchParams;
  const activeBoard = (params.board as BoardType) ?? null;

  const activeDef = ALL_BOARDS.find((b) => b.type === activeBoard) ?? null;

  const { data: messages } = activeBoard
    ? await supabase
        .from('messages')
        .select('*, character:characters(username)')
        .eq('board', activeBoard)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: null };

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      {/* Header */}
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">📋 Message Boards</h1>
        <p className="text-slate-400 text-sm mt-1">
          Community discussion across Bureau 21 — pick a channel and broadcast
        </p>
      </div>

      {/* Forum index — no board selected */}
      {!activeBoard && (
        <div className="space-y-6">
          {SECTIONS.map((section) => (
            <div key={section.heading} className={`border-l-4 ${section.accent} pl-4`}>
              <h2 className="text-lg font-bold text-slate-100">{section.heading}</h2>
              <p className="text-slate-400 text-xs mb-3">{section.subheading}</p>
              <div className="grid gap-2">
                {section.boards.map((b) => (
                  <Link
                    key={b.type}
                    href={`/boards?board=${b.type}`}
                    className="bg-slate-800 border border-slate-700 rounded-lg p-3 hover:border-slate-500 transition-colors flex items-start gap-3 min-h-[56px]"
                  >
                    <span className="text-2xl leading-none mt-0.5">{b.icon}</span>
                    <div>
                      <p className="text-slate-200 font-semibold text-sm">{b.label}</p>
                      <p className="text-slate-400 text-xs mt-0.5">{b.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Board view — board selected */}
      {activeBoard && activeDef && (
        <>
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/boards"
              className="text-slate-400 hover:text-amber-400 text-sm transition-colors"
            >
              ← All boards
            </Link>
            <span className="text-slate-600">|</span>
            <span className="text-slate-300 text-sm font-medium">
              {activeDef.icon} {activeDef.label}
            </span>
          </div>

          {/* Board description */}
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-slate-400">
            {activeDef.description}
          </div>

          {/* New Post form */}
          <NewPostForm board={activeBoard} />

          {/* Posts list */}
          <div className="space-y-3">
            {!messages || messages.length === 0 ? (
              <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center text-slate-400 text-sm">
                No posts yet — be the first to broadcast.
              </div>
            ) : (
              messages.map((m) => {
                const msg = m as Message & { character: { username: string } | null };
                return (
                  <div
                    key={m.id}
                    className="bg-slate-800 rounded-lg border border-slate-700 p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <h3 className="text-slate-200 font-semibold">{m.title}</h3>
                      <span className="text-slate-500 text-xs shrink-0 ml-2">
                        {timeAgo(m.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-1">
                      by{' '}
                      <span className="text-amber-400">
                        {msg.character?.username ?? 'Unknown'}
                      </span>
                    </p>
                    <p className="text-slate-300 text-sm mt-2 line-clamp-2">{m.body}</p>
                  </div>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
