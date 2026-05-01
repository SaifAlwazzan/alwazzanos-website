'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, setToken, setUser } from '@/lib/oim-api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post<{ token: string; user: unknown }>('/auth/login', { email, password });
      setToken(res.token);
      setUser(res.user);
      router.replace('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block bg-slate-800 rounded-2xl p-6 mb-4">
            <div className="text-3xl font-light tracking-[6px] text-white">ALWAZZAN</div>
            <div className="h-px bg-gradient-to-r from-transparent via-brand-light to-transparent my-2"></div>
            <div className="text-lg font-bold tracking-[10px] bg-gradient-to-r from-brand-light to-brand bg-clip-text text-transparent">
              OS
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Offer &amp; Invoice Manager</h1>
          <p className="text-slate-400 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-4">
          <div>
            <label className="label">Username</label>
            <input
              type="text"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3">
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          <p className="text-xs text-slate-500 text-center pt-2">
            Default: admin / admin
          </p>
        </form>
      </div>
    </div>
  );
}
