import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

// ─── Icons ───────────────────────────────────────────────────────────────────

const CheckIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
);

const XIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
  </svg>
);

const RefreshIcon = () => (
  <svg className="h-4 w-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" />
  </svg>
);

const ChevronDownIcon = ({ open }) => (
  <svg
    className={`h-4 w-4 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    viewBox="0 0 20 20"
    fill="currentColor"
    aria-hidden="true"
  >
    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
  </svg>
);

// ─── Score Banner ─────────────────────────────────────────────────────────────

const ScoreBanner = ({ score, total, onRetry }) => {
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;
  const emoji = pct === 100 ? '🎉' : pct >= 60 ? '👍' : '📚';
  const msg =
    pct === 100
      ? 'Perfect score! Excellent work!'
      : pct >= 60
      ? 'Good effort! Review the explanations to strengthen your understanding.'
      : 'Keep studying — check the explanations below for guidance.';

  return (
    <div className="mt-6 animate-fade-slide-up overflow-hidden rounded-2xl border border-brand-500/25 bg-gradient-to-br from-brand-500/10 to-cyan-500/10">
      <div className="px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">
              {emoji} {score} / {total} correct{' '}
              <span className="text-sm font-normal text-slate-500 dark:text-slate-400">
                ({pct}%)
              </span>
            </p>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">{msg}</p>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-2 rounded-xl border border-ez-border bg-ez-card px-4 py-2 text-sm font-medium text-slate-800 transition duration-200 ease-in-out hover:border-brand-500/40 hover:bg-brand-500/10 dark:text-slate-200"
          >
            <RefreshIcon />
            Try again
          </button>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-ez-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-cyan-500 transition-all duration-700 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Explanation Accordion ────────────────────────────────────────────────────

const ExplanationPanel = ({ explanation }) => {
  const [open, setOpen] = useState(false);
  if (!explanation) return null;

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-500 dark:text-brand-300 dark:hover:text-brand-200 transition-colors duration-150"
        aria-expanded={open}
      >
        <ChevronDownIcon open={open} />
        {open ? 'Hide explanation' : 'Show explanation'}
      </button>
      {open && (
        <p className="mt-2 rounded-xl bg-brand-500/8 px-3 py-2.5 text-xs leading-relaxed text-slate-700 dark:text-slate-300 border border-brand-500/15">
          {explanation}
        </p>
      )}
    </div>
  );
};

// ─── Single Question ─────────────────────────────────────────────────────────

const QuestionItem = ({ item, qIndex, chosenIdx, locked, onPick }) => {
  const isTrueFalse = item.type === 'true_false';

  return (
    <div className="rounded-[1.5rem] border border-ez-border bg-ez-soft/40 p-4 transition duration-200 ease-in-out">
      {/* Badge */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
            isTrueFalse
              ? 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300'
              : 'bg-brand-500/15 text-brand-600 dark:text-brand-300'
          }`}
        >
          {isTrueFalse ? 'True / False' : 'Multiple Choice'}
        </span>
      </div>

      {/* Question */}
      <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white sm:text-base">
        <span className="mr-2 text-brand-500 dark:text-brand-300">{qIndex + 1}.</span>
        {item.question}
      </p>

      {/* Options */}
      <div className={`flex ${isTrueFalse ? 'flex-row gap-3' : 'flex-col gap-2'}`}>
        {(item.options || []).map((opt, i) => {
          const isCorrect = opt === item.answer;
          const isSelected = chosenIdx === i;

          let btnClass =
            'flex items-center gap-2 min-h-[44px] rounded-2xl border px-4 py-3 text-left text-sm transition duration-200 ease-in-out ';

          if (isTrueFalse) {
            btnClass += 'flex-1 justify-center text-center font-semibold ';
          }

          if (locked) {
            if (isCorrect) {
              btnClass +=
                'border-emerald-500 bg-emerald-500/15 text-slate-900 dark:text-white';
            } else if (isSelected) {
              btnClass += 'border-red-500 bg-red-500/15 text-slate-900 dark:text-white';
            } else {
              btnClass +=
                'border-ez-border text-slate-400 opacity-50 dark:text-slate-500';
            }
          } else {
            btnClass +=
              'border-ez-border bg-ez-card/80 text-slate-800 hover:border-brand-500/40 hover:bg-brand-500/10 dark:text-slate-200 cursor-pointer';
          }

          return (
            <button
              key={`${qIndex}-opt-${i}`}
              type="button"
              disabled={locked}
              onClick={() => onPick(qIndex, i)}
              className={btnClass}
            >
              {locked && isCorrect && (
                <span className="text-emerald-500">
                  <CheckIcon />
                </span>
              )}
              {locked && isSelected && !isCorrect && (
                <span className="text-red-500">
                  <XIcon />
                </span>
              )}
              {!isTrueFalse && (
                <span className="mr-1 font-bold text-brand-500 dark:text-brand-300">
                  {String.fromCharCode(65 + i)}.
                </span>
              )}
              {opt}
            </button>
          );
        })}
      </div>

      {/* Explanation (shown only after answering) */}
      {locked && <ExplanationPanel explanation={item.explanation} />}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

function QuizCard({ quiz }) {
  const [picked, setPicked] = useState({});

  // Reset when a new quiz arrives
  useEffect(() => {
    setPicked({});
  }, [quiz]);

  const handlePick = useCallback((qIndex, optionIndex) => {
    setPicked((prev) => {
      if (prev[qIndex] !== undefined) return prev;
      return { ...prev, [qIndex]: optionIndex };
    });
  }, []);

  const handleRetry = useCallback(() => {
    setPicked({});
  }, []);

  const { score, allAnswered } = useMemo(() => {
    if (!quiz?.length) return { score: 0, allAnswered: false };
    const keys = Object.keys(picked);
    let correct = 0;
    keys.forEach((k) => {
      const qi = Number(k);
      const idx = picked[qi];
      const item = quiz[qi];
      if (item && item.options?.[idx] === item.answer) correct += 1;
    });
    return {
      score: correct,
      allAnswered: keys.length === quiz.length,
    };
  }, [picked, quiz]);

  if (!quiz || !Array.isArray(quiz) || quiz.length === 0) {
    return null;
  }

  return (
    <div className="rounded-[1.75rem] border border-ez-border bg-ez-card p-5 shadow-card-lg transition duration-200 ease-in-out">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">
            Check understanding
          </p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick quiz</h3>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-slate-500 dark:text-slate-400">{quiz.length} questions</p>
          {Object.keys(picked).length > 0 && !allAnswered && (
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1.5 rounded-xl border border-ez-border bg-ez-soft/50 px-3 py-1.5 text-xs font-medium text-slate-600 transition duration-200 ease-in-out hover:border-brand-500/40 hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-300"
            >
              <RefreshIcon />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {quiz.map((item, qIndex) => {
          const chosenIdx = picked[qIndex];
          const locked = chosenIdx !== undefined;

          return (
            <QuestionItem
              key={`${qIndex}-${item.question?.slice(0, 24) || qIndex}`}
              item={item}
              qIndex={qIndex}
              chosenIdx={chosenIdx}
              locked={locked}
              onPick={handlePick}
            />
          );
        })}
      </div>

      {/* Score banner (shown when all answered) */}
      {allAnswered && (
        <ScoreBanner score={score} total={quiz.length} onRetry={handleRetry} />
      )}
    </div>
  );
}

export default memo(QuizCard);
