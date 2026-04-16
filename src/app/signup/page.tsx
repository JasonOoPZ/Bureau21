'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GAME } from '@/lib/constants';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (username.length < 3 || username.length > 20) {
      setError('Username must be 3–20 characters.');
      setLoading(false);
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username can only contain letters, numbers, underscores, and hyphens.');
      setLoading(false);
      return;
    }

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (!authData.user) {
      setError('Signup failed. Please try again.');
      setLoading(false);
      return;
    }

    const { error: charError } = await supabase.from('characters').insert({
      user_id: authData.user.id,
      username,
      level: 1,
      xp: 0,
      credits_hand: GAME.START_CREDITS,
      credits_bank: 0,
      strength: GAME.START_STR,
      speed: GAME.START_SPD,
      endurance: GAME.START_END,
      panic: GAME.START_PAN,
      confidence: GAME.START_CONF,
      max_confidence: GAME.CONFIDENCE_CAP,
      motivation: GAME.MOTIVATION_CAP_FREE,
      max_motivation: GAME.MOTIVATION_CAP_FREE,
      life_force: GAME.START_LF,
      max_life_force: GAME.START_LF,
      atk_def_split: GAME.SPLIT_DEFAULT,
      welfare_days_remaining: GAME.WELFARE_DAYS,
      tokens: GAME.TOKENS_DAILY,
      onboarding_step: 0,
    });

    if (charError) {
      if (charError.message.includes('unique') || charError.code === '23505') {
        setError('That username is already taken. Please choose another.');
      } else {
        setError('Failed to create character: ' + charError.message);
      }
      setLoading(false);
      return;
    }

    router.push('/house');
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl border border-slate-700 p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-amber-500 tracking-widest">BUREAU 21</h1>
          <p className="text-slate-400 text-sm mt-1">Create Your Operator</p>
        </div>

        <div className="bg-cyan-900/30 border border-cyan-700 rounded-lg p-3 text-cyan-300 text-xs space-y-1">
          <p className="font-semibold">Starting stats:</p>
          <p>💰 {GAME.START_CREDITS} credits · ❤️ {GAME.START_LF} Life Force</p>
          <p>💪 {GAME.START_STR} STR · ⚡ {GAME.START_SPD} SPD</p>
          <p>🛡 {GAME.NEWBIE_DAYS}-day newbie protection</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm mb-1">Operator Name</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={20}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[48px]"
              placeholder="ShadowRunner"
            />
          </div>
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
              minLength={8}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 min-h-[48px]"
              placeholder="Min. 8 characters"
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
            {loading ? 'Creating Operator...' : 'Deploy to Bureau 21'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm">
          Already an Operator?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
