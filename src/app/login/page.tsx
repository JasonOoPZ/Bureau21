'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/house');
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl border border-slate-700 p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-500 tracking-widest">BUREAU 21</h1>
          <p className="text-slate-400 text-sm mt-1">Operator Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[48px]"
              placeholder="operator@bureau21.net"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[48px]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold py-3 rounded-lg transition-colors min-h-[48px]"
          >
            {loading ? 'Connecting...' : 'Login'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm">
          No account?{' '}
          <Link href="/signup" className="text-amber-400 hover:text-amber-300">
            Create Operator
          </Link>
        </p>
      </div>
    </div>
  );
}
