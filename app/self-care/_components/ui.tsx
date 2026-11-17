import type { ReactNode } from 'react';

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

export const fmtMoney = (n: number | null | undefined) => `৳${(n ?? 0).toLocaleString('en-US')}`;

export function fmtDate(d: string | Date | null | undefined, withTime = false) {
  if (!d) return '-';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Number.isNaN(ms) ? null : Math.ceil(ms / 86_400_000);
}

/* ------------------------- shared class strings ------------------------ */
export const inputCls =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none transition focus:border-brand focus:ring-4 focus:ring-brand/10 disabled:bg-stone-100 disabled:text-stone-500';
export const labelCls = 'mb-1.5 block text-xs font-semibold uppercase tracking-wide text-stone-500';
export const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50';
export const btnAccent =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-50';
export const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50';

/* ------------------------------ components ----------------------------- */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cx('rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6', className)}>{children}</section>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-brand">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-600">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const alertTone = {
  error: 'border-red-200 bg-red-50 text-red-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  info: 'border-sky-200 bg-sky-50 text-sky-900',
} as const;

export function Alert({ tone = 'info', children, className }: { tone?: keyof typeof alertTone; children: ReactNode; className?: string }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cx('rounded-xl border px-4 py-3 text-sm', alertTone[tone], className)}>
      {children}
    </div>
  );
}

const badgeTone: Record<string, string> = {
  Active: 'bg-emerald-100 text-emerald-800',
  Paid: 'bg-emerald-100 text-emerald-800',
  Approved: 'bg-emerald-100 text-emerald-800',
  Resolved: 'bg-emerald-100 text-emerald-800',
  Suspended: 'bg-amber-100 text-amber-900',
  Pending: 'bg-amber-100 text-amber-900',
  Unpaid: 'bg-amber-100 text-amber-900',
  'In Progress': 'bg-sky-100 text-sky-800',
  Open: 'bg-sky-100 text-sky-800',
  Disconnected: 'bg-red-100 text-red-800',
  Rejected: 'bg-red-100 text-red-800',
  Cancelled: 'bg-stone-200 text-stone-700',
  Closed: 'bg-stone-200 text-stone-700',
};

export function Badge({ value }: { value: string }) {
  return (
    <span className={cx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', badgeTone[value] ?? 'bg-stone-100 text-stone-700')}>
      {value}
    </span>
  );
}

export function Spinner({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-10 text-sm text-stone-500" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-stone-300 border-t-brand" />
      {label}
    </div>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: ReactNode; tone?: 'warn' | 'ok' }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">{label}</p>
      <div className={cx('mt-2 text-2xl font-bold', tone === 'warn' ? 'text-accent-dark' : 'text-brand')}>{value}</div>
      {hint && <p className="mt-1 text-xs text-stone-500">{hint}</p>}
    </div>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-brand">{title}</h2>
        {children}
      </div>
    </div>
  );
}
