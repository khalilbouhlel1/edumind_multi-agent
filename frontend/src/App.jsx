import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import StudyHelper from "./components/StudyHelper";
import AuthPage from "./AuthPage";
import { subjectBadgeText } from "./subjects";
import {
  TOKEN_KEY,
  clearAuthSession,
  readSessionFromStorage,
} from "./authSession";

const THEME_KEY = "edumind-theme";

function readPreferredTheme() {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(THEME_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function App() {
  const [{ isLoggedIn, user }, setAuth] = useState(() =>
    readSessionFromStorage(),
  );
  const [theme, setTheme] = useState(readPreferredTheme);

  const handleAuthSuccess = useCallback(({ user: nextUser }) => {
    setAuth({ isLoggedIn: true, user: nextUser });
  }, []);

  const logout = useCallback(() => {
    clearAuthSession();
    setAuth({ isLoggedIn: false, user: null });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      axios.defaults.headers.common.Authorization = `Bearer ${localStorage.getItem(TOKEN_KEY)}`;
    }
  }, [isLoggedIn]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        const url = String(err.config?.url || "");
        const isPublicAuth =
          url.includes("/api/auth/login") || url.includes("/api/auth/register");
        if (err.response?.status === 401 && !isPublicAuth) {
          clearAuthSession();
          setAuth({ isLoggedIn: false, user: null });
        }
        return Promise.reject(err);
      },
    );
    return () => axios.interceptors.response.eject(id);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  if (!isLoggedIn) {
    return (
      <AuthPage
        onAuthSuccess={handleAuthSuccess}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
    );
  }

  return (
    <div className="min-h-screen theme-transition">
      <header className="sticky top-0 z-40 border-b border-ez-border/70 bg-ez-bg/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-cyan-400 text-sm font-extrabold text-white shadow-card">
              M
            </span>
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                EduMind
              </span>
              <span className="block truncate text-xs uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                Smart Study Studio
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="min-h-[44px] rounded-full border border-ez-border bg-ez-card px-4 py-2 text-sm font-medium text-slate-700 shadow-card transition duration-200 hover:border-brand-400/40 hover:text-brand-600 dark:text-slate-200 dark:hover:text-white"
            >
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <span className="max-w-[140px] truncate text-sm text-slate-600 dark:text-slate-400 sm:max-w-[180px] md:max-w-[240px]">
              {user?.email}
            </span>
            {user?.subject ? (
              <span className="inline-flex max-w-[min(100%,11rem)] items-center truncate rounded-full border border-brand-500/25 bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-700 dark:text-brand-200">
                {subjectBadgeText(user.subject)}
              </span>
            ) : null}
            <button
              type="button"
              onClick={logout}
              className="min-h-[44px] shrink-0 rounded-xl px-4 py-2 text-sm font-medium text-slate-600 transition duration-200 ease-in-out hover:bg-red-500/10 hover:text-red-500 dark:text-slate-300 dark:hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 pb-28 pt-6 sm:px-6 lg:pb-10">
        <StudyHelper studySubject={user?.subject} />
      </main>
    </div>
  );
}

export default App;
