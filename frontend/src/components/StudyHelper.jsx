import React, {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import { API_BASE } from '../apiBase';
import { TOKEN_KEY, USER_KEY } from '../authSession';
import { subjectLabel } from '../subjects';
import { extractTopicLabel } from '../sessionUtils';
import SessionSidebar from './SessionSidebar';

const LazyAgentTimeline = lazy(() => import('../AgentTimeline'));
const LazyQuizCard = lazy(() => import('../QuizCard'));

const suggestedQuestions = [
  'Explain photosynthesis in simple terms',
  'What caused World War I?',
  'How does the immune system protect the body?',
  "Summarize Newton's three laws of motion",
];

const SubmitSpinner = () => (
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

function TimelineSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-ez-border bg-ez-card p-5 shadow-card">
      <div className="mb-4 h-4 w-1/3 rounded bg-ez-border" />
      <div className="space-y-2">
        <div className="h-16 rounded-lg bg-ez-border/60" />
        <div className="h-16 rounded-lg bg-ez-border/40" />
      </div>
    </div>
  );
}

function QuizSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-ez-border bg-ez-card p-5 shadow-card">
      <div className="mb-4 h-4 w-1/4 rounded bg-ez-border" />
      <div className="h-28 rounded-lg bg-ez-border/50" />
    </div>
  );
}

function AnswerSkeleton() {
  return (
    <div
      className="animate-pulse rounded-xl border border-ez-border border-l-4 border-l-brand-500/40 bg-ez-card p-6 shadow-card"
      aria-busy="true"
    >
      <div className="mb-4 flex justify-between gap-4">
        <div className="h-4 w-40 rounded bg-ez-border" />
        <div className="h-9 w-24 rounded-lg bg-ez-border/80" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-full rounded bg-ez-border/70" />
        <div className="h-3 w-full rounded bg-ez-border/60" />
        <div className="h-3 w-11/12 rounded bg-ez-border/50" />
      </div>
    </div>
  );
}

function readStoredSubjectId() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return u?.subject ?? null;
  } catch {
    return null;
  }
}

const StudyHelper = ({ studySubject }) => {
  const [question, setQuestion] = useState('');
  const questionRef = useRef(question);
  const textareaRef = useRef(null);
  const [answer, setAnswer] = useState(null);
  const [quiz, setQuiz] = useState(null);
  const [logs, setLogs] = useState([]);
  const [liveLogs, setLiveLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const eventSourceRef = useRef(null);
  const [error, setError] = useState('');
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [lastDuration, setLastDuration] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const [difficulty, setDifficulty] = useState('medium');
  const [quizRegenerating, setQuizRegenerating] = useState(false);

  const personalizationLabel = useMemo(() => {
    const sid = studySubject ?? readStoredSubjectId();
    return subjectLabel(sid);
  }, [studySubject]);

  useEffect(() => {
    questionRef.current = question;
  }, [question]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 320)}px`;
  }, [question]);

  const fetchSessions = useCallback(async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/api/sessions`);
      setSessions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Unable to load sessions:', err);
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, []);

  const displaySessions = useMemo(() => {
    if (!favoritesOnly) return sessions;
    return sessions.filter((s) => s.isFavorite);
  }, [sessions, favoritesOnly]);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const trimmedQuestion = questionRef.current.trim();
      if (!trimmedQuestion) return;

      const startedAt = Date.now();

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }

      setLoading(true);
      setError('');
      setAnswer(null);
      setQuiz(null);
      setLogs([]);
      setLiveLogs([]);
      setCopyDone(false);

      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setError('Please log in again.');
        setLoading(false);
        return;
      }

      const url = `${API_BASE}/api/ask/stream?question=${encodeURIComponent(trimmedQuestion)}&token=${encodeURIComponent(token)}&difficulty=${encodeURIComponent(difficulty)}`;
      let streamDone = false;

      const es = new EventSource(url);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        let data;
        try {
          data = JSON.parse(event.data);
        } catch {
          return;
        }

        if (data.done) {
          streamDone = true;
          es.close();
          if (eventSourceRef.current === es) {
            eventSourceRef.current = null;
          }

          if (data.error) {
            setError('Something went wrong while generating your answer.');
            setLastDuration(Date.now() - startedAt);
          } else {
            setAnswer(data.answer ?? null);
            setQuiz(Array.isArray(data.quiz) ? data.quiz : null);
            setLogs(Array.isArray(data.logs) ? data.logs : []);
            setLastDuration(Date.now() - startedAt);
            fetchSessions();
          }
          setLoading(false);
          return;
        }

        if (data.agent && data.message !== undefined) {
          setLiveLogs((prev) => [...prev, data]);
        }
      };

      es.onerror = () => {
        if (streamDone) return;
        streamDone = true;
        es.close();
        if (eventSourceRef.current === es) {
          eventSourceRef.current = null;
        }
        setLoading(false);
        setLastDuration(Date.now() - startedAt);
        setError('Failed to connect to the answer stream. Is the backend running?');
      };
    },
    [fetchSessions]
  );

  const loadSession = useCallback((entry) => {
    setQuestion(entry.question || '');
    setAnswer(entry.answer ?? null);
    setQuiz(Array.isArray(entry.quiz) ? entry.quiz : null);
    const savedLogs = Array.isArray(entry.logs) ? entry.logs : [];
    setLogs(savedLogs);
    setLiveLogs(savedLogs);
    setError('');
    setCopyDone(false);
    setHistoryOpen(false);
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    try {
      const { data } = await axios.patch(`${API_BASE}/api/sessions/${id}/favorite`);
      setSessions((prev) =>
        prev.map((s) => {
          const sid = String(s?._id ?? s?.id ?? '');
          return sid === String(id) ? { ...s, ...data } : s;
        })
      );
    } catch (err) {
      console.error('Favorite toggle failed:', err);
    }
  }, []);

  const deleteSession = useCallback(async (id) => {
    try {
      await axios.delete(`${API_BASE}/api/sessions/${id}`);
      setSessions((prev) => prev.filter((s) => String(s?._id ?? s?.id ?? '') !== String(id)));
    } catch (err) {
      console.error('Delete session failed:', err);
    }
  }, []);

  const handleDownload = useCallback(() => {
    if (!answer) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setFontSize(20);
    doc.setTextColor(248, 250, 252);
    doc.text('EduMind Report', 20, 20);

    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(`Question: ${questionRef.current}`, 20, 46);

    const splitText = doc.splitTextToSize(answer, pageWidth - 40);
    let cursorY = 60;

    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);

    splitText.forEach((line) => {
      if (cursorY > pageHeight - 20) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, 20, cursorY);
      cursorY += 7;
    });

    doc.save('study_notes.pdf');
  }, [answer]);

  const handleCopyAnswer = useCallback(async () => {
    if (!answer) return;
    try {
      await navigator.clipboard.writeText(answer);
      setCopyDone(true);
      window.setTimeout(() => setCopyDone(false), 2000);
    } catch {
      setCopyDone(false);
    }
  }, [answer]);

  const selectSuggestion = useCallback((value) => {
    setQuestion(value);
    setError('');
  }, []);

  const handleRegenerateQuiz = useCallback(async () => {
    if (!answer || quizRegenerating) return;
    setQuizRegenerating(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const { data } = await axios.post(
        `${API_BASE}/api/quiz/regenerate`,
        { answer, difficulty },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (Array.isArray(data.quiz) && data.quiz.length > 0) {
        setQuiz(data.quiz);
      }
    } catch (err) {
      console.error('Regenerate quiz failed:', err);
    } finally {
      setQuizRegenerating(false);
    }
  }, [answer, difficulty, quizRegenerating]);

  const toggleFavoritesOnly = useCallback(() => {
    setFavoritesOnly((v) => !v);
  }, []);

  const favoriteCount = useMemo(() => sessions.filter((s) => s.isFavorite).length, [sessions]);
  const latestEntry = sessions[0];
  const uniqueAgents = useMemo(
    () => new Set((logs || []).map((log) => log.agent).filter(Boolean)).size,
    [logs]
  );

  const statsCards = useMemo(
    () => [
      {
        label: 'Sessions',
        value: sessionsLoading ? '...' : sessions.length,
        helper: 'Saved to your account',
      },
      {
        label: 'Favorites',
        value: sessionsLoading ? '...' : favoriteCount,
        helper: 'Starred from history',
      },
      {
        label: 'Avg. Response',
        value: sessions.length && lastDuration ? `${(lastDuration / 1000).toFixed(1)}s` : '--',
        helper: 'Last completed request',
      },
      {
        label: 'Active Agents',
        value: uniqueAgents || '--',
        helper: 'In current answer view',
      },
    ],
    [sessionsLoading, sessions.length, favoriteCount, lastDuration, uniqueAgents]
  );

  const historyEmptyMessage = useMemo(() => {
    if (sessionsLoading) return 'Loading your history...';
    if (!sessions.length) return 'Ask your first question to build your saved study timeline.';
    if (!displaySessions.length) return 'No favorites yet - star a session or turn off the filter.';
    return null;
  }, [sessionsLoading, sessions.length, displaySessions.length]);

  const sidebarProps = useMemo(
    () => ({
      sessionsLoading,
      historyEmptyMessage,
      displaySessions,
      favoritesOnly,
      onToggleFavoritesOnly: toggleFavoritesOnly,
      onLoadSession: loadSession,
      onToggleFavorite: toggleFavorite,
      onDelete: deleteSession,
    }),
    [
      sessionsLoading,
      historyEmptyMessage,
      displaySessions,
      favoritesOnly,
      toggleFavoritesOnly,
      loadSession,
      toggleFavorite,
      deleteSession,
    ]
  );

  return (
    <div className="relative min-w-0 max-w-full overflow-x-hidden lg:pr-[23rem]">
      <div className="min-w-0 space-y-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-ez-border/70 bg-gradient-to-br from-ez-card via-ez-card to-ez-soft/90 p-6 shadow-card-lg sm:p-8">
          <div className="pointer-events-none absolute right-0 top-0 h-40 w-40 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-cyan-400/10 blur-3xl" />
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-600 dark:text-brand-300">AI study workspace</p>
          <h1 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Learn with focus, clarity, and a better rhythm.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            EduMind keeps your questions, answers, and revision flow in one cleaner space with live progress and quick review tools.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.5rem] border border-ez-border bg-ez-soft/50 p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Personalized for</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                {personalizationLabel || 'Your study goals'}
              </p>
              <p className="mt-3 max-w-md text-sm text-slate-600 dark:text-slate-400">
                Responses adapt to your profile so explanations stay more relevant and easier to follow.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-1">
              <div className="rounded-[1.5rem] border border-ez-border bg-ez-soft/50 px-4 py-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Last response</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">
                  {lastDuration ? `${(lastDuration / 1000).toFixed(1)}s` : '--'}
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-ez-border bg-ez-soft/50 px-4 py-4">
                <p className="text-xs text-slate-500 dark:text-slate-400">Latest topic</p>
                <p className="truncate text-lg font-semibold text-slate-900 dark:text-white">
                  {extractTopicLabel(latestEntry?.question)}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statsCards.map((card) => (
            <article
              key={card.label}
              className="rounded-[1.5rem] border border-ez-border bg-ez-card p-4 shadow-card transition duration-200 ease-in-out hover:border-brand-500/25"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{card.label}</p>
              <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{card.value}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{card.helper}</p>
            </article>
          ))}
        </section>

        <section className="rounded-[2rem] border border-ez-border bg-ez-card p-5 shadow-card sm:p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <label htmlFor="study-question" className="block text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Your question
            </label>
            <textarea
              ref={textareaRef}
              id="study-question"
              rows={2}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask any academic question..."
              disabled={loading}
              className="min-h-[58px] w-full resize-none rounded-[1.5rem] border border-ez-border bg-ez-soft/45 px-4 py-4 text-base text-slate-900 placeholder:text-slate-500 transition duration-200 ease-in-out focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:opacity-50 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            {personalizationLabel ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Answers are tailored for your <span className="font-medium text-slate-700 dark:text-slate-300">{personalizationLabel}</span> background
              </p>
            ) : null}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => selectSuggestion(item)}
                    className="min-h-[44px] rounded-full border border-ez-border bg-ez-soft/50 px-4 py-2 text-left text-xs text-slate-700 transition duration-200 ease-in-out hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:text-sm"
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Difficulty selector */}
                <div className="flex items-center gap-1 rounded-2xl border border-ez-border bg-ez-soft/50 p-1">
                  {['easy', 'medium', 'hard'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      disabled={loading}
                      onClick={() => setDifficulty(lvl)}
                      className={`rounded-xl px-3 py-1.5 text-xs font-semibold capitalize transition duration-200 ease-in-out ${
                        difficulty === lvl
                          ? 'bg-gradient-to-r from-brand-500 to-cyan-500 text-white shadow-sm'
                          : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex min-h-[50px] w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-brand-500 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-card transition duration-200 ease-in-out hover:from-brand-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                >
                  {loading ? <SubmitSpinner /> : null}
                  {loading ? 'Thinking...' : 'Ask AI'}
                </button>
              </div>
            </div>
          </form>
        </section>

        {error ? (
          <div
            className="rounded-[1.5rem] border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-500 dark:text-red-400"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        {loading && !answer ? <AnswerSkeleton /> : null}

        {answer ? (
          <div className="animate-fade-slide-up rounded-[2rem] border border-ez-border border-l-4 border-l-brand-500 bg-ez-card p-6 shadow-card-lg">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">Final answer</p>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Your generated explanation</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopyAnswer}
                  className="min-h-[44px] rounded-2xl border border-ez-border bg-ez-soft/50 px-4 py-2 text-sm font-medium text-slate-800 transition duration-200 ease-in-out hover:border-brand-500/40 hover:bg-brand-500/10 dark:text-slate-200"
                >
                  {copyDone ? 'Copied!' : 'Copy answer'}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="min-h-[44px] rounded-2xl bg-gradient-to-r from-brand-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-card transition duration-200 ease-in-out hover:from-brand-400 hover:to-cyan-400"
                >
                  Download PDF
                </button>
              </div>
            </div>
            <div className="prose prose-sm max-w-none text-slate-700 dark:prose-invert dark:text-slate-200 sm:prose-base">
              <p className="whitespace-pre-wrap text-slate-700 dark:text-slate-200">{answer}</p>
            </div>
          </div>
        ) : null}

        {(loading || liveLogs.length > 0) && (
          <Suspense fallback={<TimelineSkeleton />}>
            <LazyAgentTimeline liveLogs={liveLogs} loading={loading} />
          </Suspense>
        )}

        {quiz?.length ? (
          <Suspense fallback={<QuizSkeleton />}>
            <LazyQuizCard quiz={quiz} />
          </Suspense>
        ) : null}

        {/* Regenerate quiz button (shown when a quiz exists and not loading) */}
        {quiz?.length && !loading ? (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={handleRegenerateQuiz}
              disabled={quizRegenerating}
              className="flex items-center gap-2 rounded-2xl border border-ez-border bg-ez-card px-5 py-2.5 text-sm font-medium text-slate-700 shadow-card transition duration-200 ease-in-out hover:border-brand-500/40 hover:bg-brand-500/10 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-slate-300 dark:hover:text-brand-300"
            >
              {quizRegenerating ? (
                <SubmitSpinner />
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
                </svg>
              )}
              {quizRegenerating ? 'Generating new questions...' : 'Regenerate Quiz'}
            </button>
          </div>
        ) : null}

        <section className="rounded-[1.75rem] border border-dashed border-ez-border bg-ez-card/50 p-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-300">Ideas to add next</h3>
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-slate-600 dark:text-slate-500">
            <li>Line chart for questions per day</li>
            <li>Subject badges (Math, Biology, History)</li>
            <li>Pin favorite answers to the top</li>
            <li>Richer live timeline for sub-steps</li>
          </ul>
        </section>
      </div>

      <aside className="pointer-events-auto fixed right-4 top-24 z-30 hidden max-h-[calc(100vh-7rem)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-[1.75rem] border border-ez-border bg-ez-card/95 p-4 shadow-card-lg lg:block">
        <SessionSidebar {...sidebarProps} />
      </aside>

      <div className="fixed bottom-4 left-4 right-4 z-40 flex justify-center lg:hidden">
        <button
          type="button"
          onClick={() => setHistoryOpen(true)}
          className="min-h-[48px] rounded-full border border-ez-border bg-ez-card px-6 py-3 text-sm font-semibold text-slate-900 shadow-card-lg transition duration-200 ease-in-out hover:border-brand-500/40 hover:bg-brand-500/10 dark:text-white"
        >
          History
        </button>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-black/60 transition-opacity duration-200 ease-in-out lg:hidden ${
          historyOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!historyOpen}
        onClick={() => setHistoryOpen(false)}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-50 max-h-[78vh] rounded-t-[2rem] border border-ez-border bg-ez-card p-4 shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          historyOpen ? 'translate-y-0' : 'pointer-events-none translate-y-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Session history"
      >
        <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-ez-border" />
        <SessionSidebar {...sidebarProps} />
      </div>
    </div>
  );
};

export default StudyHelper;
