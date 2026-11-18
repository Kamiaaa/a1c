'use client';

import { getPageItems } from '@/lib/pagination';

interface Props {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPage: (page: number) => void;
  onLimit: (limit: number) => void;
  pageSizes?: number[];
  disabled?: boolean;
}

const btn =
  'min-w-9 cursor-pointer rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40';

export function Pagination({ page, limit, total, totalPages, onPage, onLimit, pageSizes = [10, 25, 50, 100], disabled }: Props) {
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-col gap-3 border-t border-slate-800 px-4 py-4 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between md:px-6">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          Showing <span className="font-semibold text-slate-200">{from}-{to}</span> of <span className="font-semibold text-slate-200">{total}</span>
        </span>
        <label className="flex items-center gap-2">
          <span className="sr-only sm:not-sr-only">Rows</span>
          <select
            value={limit}
            disabled={disabled}
            onChange={(e) => onLimit(Number(e.target.value))}
            aria-label="Rows per page"
            className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950 px-2 py-1.5 text-sm text-slate-200 focus:outline-none"
          >
            {pageSizes.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
      </div>

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <button className={btn} disabled={disabled || page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
          &larr; <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Small screens: just "Page x of y" */}
        <span className="px-2 text-slate-300 sm:hidden">Page {page} of {totalPages}</span>

        <div className="hidden items-center gap-1.5 sm:flex">
          {getPageItems(page, totalPages).map((item, i) =>
            item === '…' ? (
              <span key={`gap-${i}`} className="px-1 text-slate-600" aria-hidden>…</span>
            ) : (
              <button
                key={item}
                disabled={disabled}
                onClick={() => onPage(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`${btn} ${item === page ? '!border-slate-600 !bg-slate-100 !text-slate-950' : ''}`}
              >
                {item}
              </button>
            )
          )}
        </div>

        <button className={btn} disabled={disabled || page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
          <span className="hidden sm:inline">Next</span> &rarr;
        </button>
      </nav>
    </div>
  );
}
