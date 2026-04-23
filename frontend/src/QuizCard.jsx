import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

function QuizCard({ quiz }) {
  const [picked, setPicked] = useState({});

  useEffect(() => {
    setPicked({});
  }, [quiz]);

  const handlePick = useCallback((qIndex, optionIndex) => {
    setPicked((prev) => {
      if (prev[qIndex] !== undefined) return prev;
      return { ...prev, [qIndex]: optionIndex };
    });
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
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">Check understanding</p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Quick quiz</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{quiz.length} questions</p>
      </div>

      <div className="space-y-6">
        {quiz.map((item, qIndex) => {
          const chosenIdx = picked[qIndex];
          const locked = chosenIdx !== undefined;

          return (
            <div
              key={`${qIndex}-${item.question?.slice(0, 24) || qIndex}`}
              className="rounded-[1.5rem] border border-ez-border bg-ez-soft/40 p-4 transition duration-200 ease-in-out"
            >
              <p className="mb-4 text-sm font-semibold leading-relaxed text-slate-900 dark:text-white sm:text-base">
                <span className="mr-2 text-brand-500 dark:text-brand-300">{qIndex + 1}.</span>
                {item.question}
              </p>
              <div className="flex flex-col gap-2">
                {(item.options || []).map((opt, i) => {
                  const isCorrect = opt === item.answer;
                  const isSelected = chosenIdx === i;

                  let btnClass =
                    'min-h-[44px] w-full rounded-2xl border px-4 py-3 text-left text-sm transition duration-200 ease-in-out ';
                  if (locked) {
                    if (isCorrect) {
                      btnClass += 'border-emerald-500 bg-emerald-500/15 text-slate-900 dark:text-white';
                    } else if (isSelected) {
                      btnClass += 'border-red-500 bg-red-500/15 text-slate-900 dark:text-white';
                    } else {
                      btnClass += 'border-ez-border text-slate-400 opacity-50 dark:text-slate-500';
                    }
                  } else {
                    btnClass +=
                      'border-ez-border bg-ez-card/80 text-slate-800 hover:border-brand-500/40 hover:bg-brand-500/10 dark:text-slate-200';
                  }

                  return (
                    <button
                      key={`${qIndex}-opt-${i}`}
                      type="button"
                      disabled={locked}
                      onClick={() => handlePick(qIndex, i)}
                      className={btnClass}
                    >
                      <span className="mr-2 font-bold text-brand-500 dark:text-brand-300">{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {allAnswered ? (
        <div className="mt-6 animate-slide-in rounded-2xl border border-brand-500/25 bg-brand-500/10 px-4 py-3 text-center text-sm font-semibold text-brand-700 transition duration-200 ease-in-out dark:text-brand-200">
          Score: {score} / {quiz.length} correct
        </div>
      ) : null}
    </div>
  );
}

export default memo(QuizCard);
