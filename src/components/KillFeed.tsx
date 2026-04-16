'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { KillFeedEntry } from '@/types/game';
import { timeAgo } from '@/lib/utils';

export default function KillFeed() {
  const [entries, setEntries] = useState<KillFeedEntry[]>([]);
  const supabase = createClient();

  useEffect(() => {
    supabase
      .from('kill_feed')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data }) => {
        if (data) setEntries(data);
      });

    const channel = supabase
      .channel('kill_feed_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'kill_feed' },
        (payload) => {
          setEntries((prev) => [payload.new as KillFeedEntry, ...prev.slice(0, 19)]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  const eventIcon = (type: string) => {
    switch (type) {
      case 'kill': return '💀';
      case 'discovery': return '🔬';
      case 'achievement': return '🏆';
      case 'syndicate': return '🤝';
      default: return '📡';
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700 p-3 max-h-64 overflow-y-auto">
      <h3 className="text-cyan-400 font-semibold text-sm mb-2">📡 Station Feed</h3>
      {entries.length === 0 ? (
        <p className="text-slate-500 text-xs">Station quiet... for now.</p>
      ) : (
        <div className="space-y-1">
          {entries.map((e) => (
            <div key={e.id} className="flex gap-2 text-xs">
              <span>{eventIcon(e.event_type)}</span>
              <span className="text-slate-300 flex-1">{e.message}</span>
              <span className="text-slate-500 shrink-0">{timeAgo(e.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
