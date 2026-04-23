import React, { useCallback, useState } from 'react';
import axios from 'axios';
import { API_BASE } from './apiBase';
import { persistAuthSession } from './authSession';
import { STUDY_SUBJECTS } from './subjects';

const Spinner = () => (
  <svg
    className="h-5 w-5 shrink-0 animate-spin text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const AuthPage = ({ onAuthSuccess, theme, onToggleTheme }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const switchMode = useCallback((next) => {
    setMode(next);
    setError('');
    if (next === 'login') {
      setSelectedSubject(null);
    }
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      const path = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const url = `${API_BASE}${path}`;

      if (mode === 'register' && !selectedSubject) {
        setError('Please select your field of study.');
        setLoading(false);
        return;
      }

      try {
        const body =
          mode === 'register'
            ? { email: email.trim(), password, subject: selectedSubject }
            : { email: email.trim(), password };

        const response = await axios.post(url, body);
        const { token, user } = response.data || {};
        if (!token || !user?.id || !user?.email) {
          setError('Unexpected response from server.');
          return;
        }
        const fullUser = {
          id: user.id,
          email: user.email,
          subject: user.subject,
        };
        persistAuthSession(token, fullUser);
        onAuthSuccess({ token, user: fullUser });
      } catch (err) {
        const status = err.response?.status;
        const message = err.response?.data?.error;

        if (status === 409) {
          setError(message || 'An account with this email already exists.');
        } else if (status === 401) {
          setError(message || 'Invalid email or password.');
        } else if (status === 400) {
          setError(message || 'Please check your email and password.');
        } else if (err.code === 'ERR_NETWORK') {
          setError('Cannot reach server. Is the backend running?');
        } else {
          setError(message || 'Something went wrong. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, mode, onAuthSuccess, selectedSubject]
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background:
            'radial-gradient(ellipse 90% 60% at 10% 10%, rgba(58, 103, 247, 0.18), transparent), radial-gradient(ellipse 80% 50% at 100% 0%, rgba(14, 165, 233, 0.14), transparent), radial-gradient(ellipse 70% 40% at 50% 100%, rgba(14, 165, 233, 0.12), transparent)',
        }}
      />
      <div className="relative z-10 grid w-full max-w-6xl gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="glass-panel hidden rounded-[2rem] p-8 shadow-card-lg lg:block">
          <div className="inline-flex items-center gap-3 rounded-full border border-brand-500/20 bg-brand-500/10 px-4 py-2 text-sm font-medium text-brand-700 dark:text-brand-200">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-cyan-400 font-extrabold text-white">
              M
            </span>
            EduMind
          </div>
          <h1 className="mt-8 max-w-lg text-5xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
            Learn with a calmer, smarter study workspace.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Ask questions, save sessions, review quizzes, and keep your learning flow organized in one modern interface.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              ['Live help', 'AI answers with step tracking'],
              ['Saved history', 'Come back to every session'],
              ['Quick quizzes', 'Check understanding instantly'],
            ].map(([title, text]) => (
              <div key={title} className="rounded-3xl border border-ez-border/70 bg-ez-soft/60 p-4">
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="glass-panel relative w-full rounded-[2rem] p-6 shadow-card-lg transition duration-200 ease-in-out sm:p-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-cyan-400 text-lg font-extrabold text-white shadow-card">
                M
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Welcome to EduMind</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Your study workspace, history, and AI answers sync after you log in.
              </p>
            </div>
            <button
              type="button"
              onClick={onToggleTheme}
              className="min-h-[44px] rounded-full border border-ez-border bg-ez-card px-4 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:border-brand-400/35 hover:text-brand-600 dark:text-slate-200"
            >
              {theme === 'dark' ? 'Light' : 'Dark'}
            </button>
          </div>

          <div className="mb-6 flex rounded-full border border-ez-border bg-ez-soft/65 p-1" role="tablist" aria-label="Login or register">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              onClick={() => switchMode('login')}
              className={`min-h-[44px] flex-1 rounded-full px-4 text-sm font-semibold transition duration-200 ease-in-out ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'register'}
              onClick={() => switchMode('register')}
              className={`min-h-[44px] flex-1 rounded-full px-4 text-sm font-semibold transition duration-200 ease-in-out ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-md'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
              }`}
            >
              Register
            </button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="auth-email" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Email
              </label>
              <input
                id="auth-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={loading}
                required
                className="min-h-[48px] w-full rounded-2xl border border-ez-border bg-ez-soft/45 px-4 py-3 text-slate-900 placeholder:text-slate-500 transition duration-200 ease-in-out focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="you@school.edu"
              />
            </div>
            <div>
              <label htmlFor="auth-password" className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Password
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                disabled={loading}
                required
                minLength={mode === 'register' ? 8 : undefined}
                className="min-h-[48px] w-full rounded-2xl border border-ez-border bg-ez-soft/45 px-4 py-3 text-slate-900 placeholder:text-slate-500 transition duration-200 ease-in-out focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 disabled:opacity-50 dark:text-slate-100 dark:placeholder:text-slate-500"
                placeholder="........"
              />
            </div>

            {mode === 'register' ? (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Field of study</p>
                <div className="grid grid-cols-2 gap-2" role="group" aria-label="Field of study">
                  {STUDY_SUBJECTS.map((s) => {
                    const selected = selectedSubject === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={loading}
                        onClick={() => setSelectedSubject(s.id)}
                        className={`flex min-h-[48px] flex-col items-center justify-center gap-1 rounded-2xl border px-2 py-3 text-center text-xs font-medium transition duration-200 ease-in-out sm:text-sm ${
                          selected
                            ? 'border-brand-500 bg-brand-500/12 text-slate-900 ring-2 ring-brand-500/25 dark:text-white'
                            : 'border-ez-border bg-ez-soft/45 text-slate-700 hover:border-brand-500/40 hover:bg-brand-500/5 dark:text-slate-300'
                        }`}
                      >
                        <span className="text-lg leading-none" aria-hidden="true">
                          {s.emoji}
                        </span>
                        <span className="leading-tight">{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-500 dark:text-red-400" role="alert">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-white shadow-card transition duration-200 ease-in-out hover:from-brand-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Spinner /> : null}
              {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
