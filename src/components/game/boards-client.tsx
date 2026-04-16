"use client";

import { useState } from "react";
import Link from "next/link";

interface BoardPost {
  id: string;
  title: string;
  body: string;
  category: string;
  karma: number;
  authorId: string;
  authorName: string;
  createdAt: string;
}

const CATEGORIES = [
  "announcements", "bugfix", "game-discussion", "game-help", "suggestions", "trading",
  "non-game", "for-fun", "video-games", "entertainment", "tech", "foodies", "sports", "book-club",
] as const;
const CAT_LABELS: Record<string, string> = {
  announcements: "Announcements", bugfix: "Bugfix", "game-discussion": "Game Discussion",
  "game-help": "Game Help", suggestions: "Suggestions", trading: "Trading",
  "non-game": "Non-Game", "for-fun": "For Fun", "video-games": "Video Games",
  entertainment: "Entertainment", tech: "Tech", foodies: "Foodies", sports: "Sports", "book-club": "Book Club",
};
const CAT_COLORS: Record<string, string> = {
  announcements: "text-red-400 border-red-900",
  bugfix: "text-orange-400 border-orange-900",
  "game-discussion": "text-slate-400 border-slate-700",
  "game-help": "text-emerald-400 border-emerald-900",
  suggestions: "text-yellow-400 border-yellow-900",
  trading: "text-amber-400 border-amber-900",
  "non-game": "text-blue-400 border-blue-900",
  "for-fun": "text-pink-400 border-pink-900",
  "video-games": "text-purple-400 border-purple-900",
  entertainment: "text-cyan-400 border-cyan-900",
  tech: "text-indigo-400 border-indigo-900",
  foodies: "text-lime-400 border-lime-900",
  sports: "text-teal-400 border-teal-900",
  "book-club": "text-rose-400 border-rose-900",
};

interface Props {
  initialPosts: BoardPost[];
  currentUser: string;
  boardCategory?: string;
}

export function BoardsClient({ initialPosts, currentUser, boardCategory }: Props) {
  const [posts, setPosts] = useState<BoardPost[]>(initialPosts);
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>(boardCategory ?? "game-discussion");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function vote(postId: string, direction: 1 | -1) {
    try {
      const res = await fetch("/api/game/boards", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, direction }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, karma: data.karma } : p));
      }
    } catch { /* ignore */ }
  }

  async function submit() {
    if (!title.trim() || !body.trim() || loading) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/game/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Post failed.");
        return;
      }
      setPosts((prev) => [
        {
          id: data.post.id,
          title: data.post.title,
          body: data.post.body,
          category: data.post.category,
          karma: 0,
          authorId: data.post.author?.id ?? "",
          authorName: currentUser,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setBody("");
      setComposing(false);
    } catch {
      setError("Connection error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* New post button */}
      <div className="flex justify-end">
        <button
          onClick={() => setComposing(!composing)}
          className="rounded border border-emerald-800 bg-emerald-950/30 px-3 py-1.5 text-[11px] text-emerald-300 hover:bg-emerald-950/60 transition"
        >
          {composing ? "Cancel" : "+ New Post"}
        </button>
      </div>

      {/* Compose form */}
      {composing && (
        <div className="rounded-md border border-emerald-900/40 bg-[#0a0f0a] p-4">
          <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-emerald-600">New Post</p>
          {error && (
            <p className="mb-2 text-[11px] text-red-400">{error}</p>
          )}
          <div className="space-y-2">
            {!boardCategory && (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[12px] text-slate-200 focus:border-cyan-600 focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CAT_LABELS[c] ?? c}</option>
                ))}
              </select>
            )}
            <input
              placeholder="Post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-600 focus:outline-none"
            />
            <textarea
              placeholder="Post body..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={2000}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-600 focus:outline-none"
            />
            <button
              onClick={submit}
              disabled={!title.trim() || !body.trim() || loading}
              className="rounded border border-emerald-800 bg-emerald-950/40 px-4 py-1.5 text-[12px] text-emerald-300 transition hover:bg-emerald-950/70 disabled:cursor-not-allowed disabled:opacity-30"
            >
              {loading ? "Posting..." : "Post to Boards"}
            </button>
          </div>
        </div>
      )}

      {/* Post list */}
      {posts.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-8 text-center">
          <p className="text-[11px] text-slate-600">No posts yet in this channel. Be the first to post.</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="rounded-md border border-slate-800 bg-[#0a0d11]">
            <button
              onClick={() => setExpanded(expanded === post.id ? null : post.id)}
              className="w-full px-4 py-3 text-left"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] rounded border px-1.5 py-0.5 uppercase tracking-wide ${CAT_COLORS[post.category] ?? "text-slate-400 border-slate-700"}`}>
                      {post.category}
                    </span>
                    <span className="text-[12px] font-medium text-slate-200 truncate">{post.title}</span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-600">
                    by{" "}
                    <Link
                      href={`/pilot/${post.authorId}`}
                      className="text-cyan-500 hover:text-cyan-300 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.authorName}
                    </Link>
                    {" "}· {new Date(post.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="shrink-0 text-[11px] text-slate-600">{expanded === post.id ? "▲" : "▼"}</span>
              </div>
            </button>
            {expanded === post.id && (
              <div className="border-t border-slate-800/60 px-4 py-3">
                <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-300">{post.body}</p>
                <div className="mt-3 flex items-center gap-3 border-t border-slate-800/40 pt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); vote(post.id, 1); }}
                    className="text-[11px] text-slate-500 hover:text-emerald-400 transition"
                  >▲</button>
                  <span className={`text-[11px] font-bold ${post.karma > 0 ? "text-emerald-400" : post.karma < 0 ? "text-red-400" : "text-slate-600"}`}>
                    {post.karma}
                  </span>
                  <button
                    onClick={(e) => { e.stopPropagation(); vote(post.id, -1); }}
                    className="text-[11px] text-slate-500 hover:text-red-400 transition"
                  >▼</button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
