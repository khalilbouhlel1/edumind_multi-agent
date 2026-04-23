import React, { memo, useMemo } from 'react';

const STEPS = [
  { id: 'planner', label: 'Planner', agentName: 'Planner Agent' },
  { id: 'research', label: 'Research', agentName: 'Research Agent' },
  { id: 'writer', label: 'Writer', agentName: 'Writer Agent' },
  { id: 'quiz', label: 'Quiz', agentName: 'Quiz Agent' },
];

const CheckIcon = () => (
  <svg className="h-5 w-5 text-emerald-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

function AgentTimeline({ liveLogs, loading }) {
  const lastAgent = useMemo(() => {
    if (!liveLogs?.length) return null;
    return liveLogs[liveLogs.length - 1]?.agent ?? null;
  }, [liveLogs]);

  const logsByAgent = useMemo(() => {
    const map = new Map();
    for (const step of STEPS) {
      map.set(step.agentName, []);
    }
    (liveLogs || []).forEach((log) => {
      const agent = log?.agent;
      if (!agent || !map.has(agent)) return;
      map.get(agent).push(log);
    });
    return map;
  }, [liveLogs]);

  return (
    <div className="rounded-[1.75rem] border border-ez-border bg-ez-card p-5 shadow-card transition duration-200 ease-in-out">
      <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">Live pipeline</p>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Agent timeline</h3>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">Steps update as the model runs</p>
      </div>

      <ol className="relative flex flex-col gap-3">
        <span
          className="absolute bottom-6 left-[19px] top-6 w-px bg-ez-border sm:left-[21px]"
          aria-hidden="true"
        />
        {STEPS.map((step) => {
          const stepLogs = logsByAgent.get(step.agentName) || [];
          const hasLogs = stepLogs.length > 0;
          const isRunning = Boolean(loading && lastAgent === step.agentName);
          const isComplete = hasLogs && !isRunning;

          let cardClass =
            'relative rounded-[1.5rem] border bg-ez-soft/45 p-4 pl-12 transition duration-200 ease-in-out sm:pl-14';
          if (isComplete) {
            cardClass +=
              ' border-brand-500/40 shadow-[0_0_0_1px_rgba(58,103,247,0.14)] ring-1 ring-brand-500/10';
          } else if (isRunning) {
            cardClass += ' border-brand-400/60 shadow-card';
          } else {
            cardClass += ' border-ez-border opacity-80';
          }

          return (
            <li key={step.id} className={cardClass}>
              <div className="absolute left-3 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-ez-border bg-ez-card sm:left-4">
                {isComplete ? (
                  <CheckIcon />
                ) : isRunning ? (
                  <span className="relative flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-40" />
                    <span className="relative inline-flex h-3 w-3 animate-pulse-dot rounded-full bg-brand-500" />
                  </span>
                ) : (
                  <span className="h-2 w-2 rounded-full bg-slate-500 dark:bg-slate-600" />
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span
                  className={`text-sm font-semibold ${
                    isComplete || isRunning ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {!hasLogs && !isRunning ? (
                  <span className="text-xs text-slate-500 dark:text-slate-500">Waiting</span>
                ) : isRunning ? (
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-300">Running...</span>
                ) : (
                  <span className="text-xs font-medium text-emerald-500">Done</span>
                )}
              </div>
              <ul className="mt-3 max-h-36 space-y-2 overflow-y-auto text-sm">
                {stepLogs.map((log, idx) => (
                  <li key={`${step.id}-${idx}-${log.timestamp || idx}`} className="flex gap-2 text-slate-500 dark:text-slate-400">
                    <span className="shrink-0 font-mono text-xs text-slate-400 dark:text-slate-500">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                    </span>
                    <span className="min-w-0 text-slate-700 dark:text-slate-300">{log.message}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default memo(AgentTimeline);
