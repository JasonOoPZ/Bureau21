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

const CATEGORIES = ["all", "general", "trading", "help", "events"] as const;
const CAT_COLORS: Record<string, string> = {
  general: "text-slate-400 border-slate-700",
  trading: "text-amber-400 border-amber-900",
  help: "text-emerald-400 border-emerald-900",
  events: "text-cyan-400 border-cyan-900",
};

interface Props {
  initialPosts: BoardPost[];
  currentUser: string;
}

export function BoardsClient({ initialPosts, currentUser }: Props) {
  const [posts, setPosts] = useState<BoardPost[]>(initialPosts);
  const [filter, setFilter] = useState<string>("all");
  const [composing, setComposing] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<string>("general");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = filter === "all" ? posts : posts.filter((p) => p.category === filter);

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
      {/* Category filter + new post button */}
      <div className="flex flex-wrap items-center gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`rounded border px-3 py-1 text-[11px] capitalize transition ${
              filter === cat
                ? "border-cyan-700 bg-cyan-950/40 text-cyan-300"
                : "border-slate-800 bg-slate-900/40 text-slate-500 hover:text-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
        <button
          onClick={() => setComposing(!composing)}
          className="ml-auto rounded border border-emerald-800 bg-emerald-950/30 px-3 py-1 text-[11px] text-emerald-300 hover:bg-emerald-950/60"
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
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-3 py-2 text-[12px] text-slate-200 focus:border-cyan-600 focus:outline-none"
            >
              {CATEGORIES.filter((c) => c !== "all").map((c) => (
                <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
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
      {filtered.length === 0 ? (
        <div className="rounded-md border border-slate-800 bg-[#0a0d11] p-8 text-center">
          <p className="text-[11px] text-slate-600">No posts yet in this channel. Be the first to post.</p>
        </div>
      ) : (
        filtered.map((post) => (
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
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
