
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LockKeyhole,
  ShieldCheck,
  Eye,
  EyeOff,
} from 'lucide-react';
import { send } from '../lib/api';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setError('');

    try {
      await send('/auth/login', 'POST', {
        email: email.trim().toLowerCase(),
        password,
      });

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-[75vh] items-center justify-center bg-[#edf3ef] px-5 py-16">
      <div className="w-full max-w-md rounded-[30px] bg-white p-8 shadow-xl sm:p-10">
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <ShieldCheck size={27} />
        </span>

        <p className="eyebrow mt-7">Secure administration</p>

        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Welcome back.
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Sign in to manage courses, students and attendance.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block">
            <span className="label">Admin email</span>

            <input
              className="field"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <label className="block">
            <span className="label">Password</span>

            <div className="relative">
              <input
                className="field w-full pr-12"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />

              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="btn-dark w-full disabled:opacity-60"
          >
            <LockKeyhole size={17} />
            {busy ? 'Signing in...' : 'Sign in securely'}
          </button>
        </form>
      </div>
    </main>
  );
}
