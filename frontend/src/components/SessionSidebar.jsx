import React, { memo } from 'react';
import { extractTopicLabel, previewText, sessionId } from '../sessionUtils';

function SessionSidebar({
  sessionsLoading,
  historyEmptyMessage,
  displaySessions,
  favoritesOnly,
  onToggleFavoritesOnly,
  onLoadSession,
  onToggleFavorite,
  onDelete,
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">History</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">Saved sessions</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onToggleFavoritesOnly}
        aria-pressed={favoritesOnly}
        className={`mb-4 min-h-[44px] w-full rounded-full border px-4 py-2.5 text-sm font-semibold transition duration-200 ease-in-out ${
          favoritesOnly
            ? 'border-brand-500/40 bg-brand-500/12 text-brand-700 dark:text-brand-200'
            : 'border-ez-border bg-ez-soft/55 text-slate-600 hover:border-brand-500/30 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
        }`}
      >
        Favorites only
      </button>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {sessionsLoading ? (
          <div className="space-y-3" aria-busy="true">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-[1.25rem] border border-ez-border bg-ez-soft/60 p-4"
              >
                <div className="mb-2 h-3 w-1/3 rounded bg-ez-border" />
                <div className="mb-2 h-3 w-full rounded bg-ez-border/80" />
                <div className="h-3 w-2/3 rounded bg-ez-border/60" />
              </div>
            ))}
          </div>
        ) : historyEmptyMessage ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">{historyEmptyMessage}</p>
        ) : (
          displaySessions.map((entry, index) => {
            const id = sessionId(entry);
            return (
              <div
                key={id}
                role="button"
                tabIndex={0}
                onClick={() => onLoadSession(entry)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onLoadSession(entry);
                  }
                }}
                style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                className="animate-slide-in cursor-pointer rounded-[1.25rem] border border-ez-border bg-ez-soft/55 p-4 shadow-card transition duration-200 ease-in-out hover:border-brand-500/35 hover:bg-brand-500/5 focus:outline-none focus:ring-2 focus:ring-brand-500/25"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {extractTopicLabel(entry.question)}
                  </span>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      title={entry.isFavorite ? 'Remove favorite' : 'Add favorite'}
                      aria-label={entry.isFavorite ? 'Remove favorite' : 'Add favorite'}
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(id);
                      }}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg transition duration-200 ease-in-out hover:bg-brand-500/15"
                    >
                      {entry.isFavorite ? '★' : '☆'}
                    </button>
                    <button
                      type="button"
                      title="Delete session"
                      aria-label="Delete session"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(id);
                      }}
                      className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-lg transition duration-200 ease-in-out hover:bg-red-500/15"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">{previewText(entry.question, 90)}</p>
                <div className="mt-2 flex justify-between gap-2 text-xs text-slate-500 dark:text-slate-500">
                  <span className="truncate">
                    {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ''}
                  </span>
                  <span className="shrink-0">{entry.isFavorite ? 'Favorite' : 'Saved'}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default memo(SessionSidebar);
