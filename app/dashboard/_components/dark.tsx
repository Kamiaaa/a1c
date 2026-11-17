'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { http } from '@/lib/http';

/* Small helpers that match the existing dark slate dashboard look. */

export const dInput =
  'w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:border-slate-600 focus:outline-none transition';
export const dLabel = 'block text-xs font-medium uppercase tracking-wider text-slate-400 mb-1';
export const dBtnPrimary =
  'rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-slate-200 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
export const dBtnGhost =
  'rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer disabled:opacity-50';
export const dCard = 'rounded-2xl border border-slate-800 bg-slate-900/40 backdrop-blur-xl';

export function useStaffRole() {
  const [role, setRole] = useState<'admin' | 'moderator' | 'user' | ''>('');
  useEffect(() => {
    http<{ role: 'admin' | 'moderator' | 'user' }>('/api/auth/me')
      .then((d) => setRole(d.role))
      .catch(() => {});
  }, []);
  return role;
}

const tone: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Paid: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Suspended: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Unpaid: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Open: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  'In Progress': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Disconnected: 'bg-red-500/10 text-red-400 border-red-500/20',
  Rejected: 'bg-red-500/10 text-red-400 border-red-500/20',
  Cancelled: 'bg-slate-800 text-slate-400 border-slate-700',
  Closed: 'bg-slate-800 text-slate-400 border-slate-700',
};

export function DBadge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${tone[value] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}>
      {value}
    </span>
  );
}

export function DModal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={`my-8 w-full ${wide ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-xl font-bold text-slate-100">{title}</h2>
        {children}
      </div>
    </div>
  );
}

export const money = (n: number | null | undefined) => `৳${(n ?? 0).toLocaleString('en-US')}`;
export const date = (d?: string | null, time = false) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}) }) : '-';

export function StatusMsg({ msg }: { msg: { type: 'error' | 'success'; text: string } | null }) {
  if (!msg) return null;
  return (
    <div
      className={`rounded-xl border p-3 text-sm ${
        msg.type === 'error' ? 'border-red-500/20 bg-red-500/10 text-red-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
      }`}
    >
      {msg.text}
    </div>
  );
}
