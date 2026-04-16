import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ChatBox from '@/components/ChatBox';
import { Character } from '@/types/game';

export default async function ChatPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const { data: character } = await supabase
    .from('characters')
    .select('id, username')
    .eq('user_id', user.id)
    .single();

  if (!character) redirect('/signup');

  const char = character as Pick<Character, 'id' | 'username'>;

  return (
    <div className="p-4 md:p-6 max-w-2xl space-y-6">
      <div className="border-b border-slate-700 pb-4">
        <h1 className="text-2xl font-bold text-amber-500">💬 Station Chat</h1>
        <p className="text-slate-400 text-sm mt-1">Talk to other operators on the station.</p>
      </div>

      <ChatBox authorId={char.id} authorName={char.username} room="town_square" />
    </div>
  );
}
