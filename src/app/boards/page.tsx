import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Message, BoardType } from '@/types/game';
import Link from 'next/link';
import { timeAgo } from '@/lib/utils';

const boards: { type: BoardType; label: string; icon: string }[] = [
  { type: 'announcements', label: 'Announcements', icon: '📢' },
  { type: 'game_help', label: 'Game Help', icon: '❓' },
  { type: 'trading', label: 'Trading Post', icon: '💱' },
  { type: 'general', label: 'General', icon: '💬' },
];

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
  const activeBoard = (params.board as BoardType) ?? 'general';

  const { data: messages } = await supabase
    .from('messages')
    .select('*, character:characters(username)')
    .eq('board', activeBoard)
    .order('created_at', { ascending: false })
    .limit(50);

  return (
    <div className="p-4 md:p-6 max-w-4xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">📋 Message Boards</h1>
        <p className="text-slate-400 text-sm mt-1">Community discussion on Bureau 21</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {boards.map((b) => (
          <Link
            key={b.type}
            href={`/boards?board=${b.type}`}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[48px] flex items-center gap-2 ${
              activeBoard === b.type
                ? 'bg-amber-500 text-slate-900'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
            }`}
          >
            {b.icon} {b.label}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {!messages || messages.length === 0 ? (
          <div className="bg-slate-800 rounded-lg border border-slate-700 p-6 text-center text-slate-400">
            No messages yet. Be the first to post!
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
                  <span className="text-amber-400">{msg.character?.username ?? 'Unknown'}</span>
                </p>
                <p className="text-slate-300 text-sm mt-2 line-clamp-2">{m.body}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
