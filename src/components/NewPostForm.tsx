'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BoardType } from '@/types/game';

export default function NewPostForm({ board }: { board: BoardType }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ board, title, body }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? 'Failed to post');
      return;
    }

    setTitle('');
    setBody('');
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold rounded-lg transition-colors min-h-[48px] text-sm"
      >
        ✏️ New Post
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3"
    >
      <h3 className="text-slate-200 font-semibold text-sm">New Post</h3>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <input
        type="text"
        placeholder="Post title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={120}
        required
        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[48px]"
      />

      <textarea
        placeholder="What do you want to say?"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        maxLength={5000}
        required
        rows={4}
        className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold rounded transition-colors text-sm min-h-[48px]"
        >
          {loading ? 'Posting…' : 'Post'}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError('');
            setTitle('');
            setBody('');
          }}
          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded transition-colors text-sm min-h-[48px]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
