// app/dashboard/page.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { http } from '@/lib/http';
import { DBadge, dCard, date, money } from './_components/dark';

interface Stats {
  role: string;
  customers?: { total: number; active: number; suspended: number; disconnected: number };
  pendingRequests?: number;
  openTickets?: number;
  unpaid?: { count: number; total: number };
  recentCustomers?: { id: string; customerId: string; name: string; status: string; planName: string | null; createdAt: string }[];
  recentRequests?: { id: string; customerName: string; customerId: string; fromPlanName: string | null; toPlanName: string; createdAt: string }[];
  admin?: { pendingOrders: number; totalOrders: number; plans: number; slides: { active: number; total: number } };
}

function StatCard({ label, value, hint, href, alert }: { label: string; value: ReactNode; hint?: ReactNode; href?: string; alert?: boolean }) {
  const body = (
    <div className={`${dCard} h-full p-6 transition ${href ? 'hover:border-slate-700 hover:bg-slate-900/70' : ''} ${alert ? 'border-amber-500/30' : ''}`}>
      <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${alert ? 'text-amber-400' : 'text-slate-100'}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
  return href ? (
    <Link href={href} className="block focus-visible:outline-2 focus-visible:outline-indigo-400 rounded-2xl">
      {body}
    </Link>
  ) : (
    body
  );
}

const Dots = <span className="animate-pulse text-slate-600">...</span>;

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    http<Stats>('/api/dashboard/stats')
      .then(setStats)
      .catch(() => setError('Could not load dashboard metrics.'))
      .finally(() => setLoading(false));
  }, []);

  const role = stats?.role;
  const ops = role === 'admin' || role === 'moderator';
  const v = (n: ReactNode) => (loading ? Dots : n);

  const c = stats?.customers;
  const total = c?.total || 0;
  const pct = (n: number) => (total ? `${(n / total) * 100}%` : '0%');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Dashboard Overview</h1>
        <p className="text-sm text-slate-400 mt-1">A summary of customers, requests and your website content.</p>
      </div>

      {error && <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">{error}</div>}

      {/* Plain 'user' accounts */}
      {!loading && role === 'user' && (
        <div className={`${dCard} p-6`}>
          <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">Account Role</p>
          <p className="text-3xl font-bold text-slate-100 mt-2 capitalize">{role}</p>
          <p className="mt-2 text-sm text-slate-400">Ask an administrator for moderator access to manage customers.</p>
        </div>
      )}

      {(loading || ops) && (
        <>
          {/* Needs attention */}
          <section aria-label="Customer care" className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-6">
            <StatCard label="Customers" value={v(c?.total ?? 0)} hint={c ? `${c.active} active · ${c.suspended} suspended` : undefined} href="/dashboard/customers" />
            <StatCard
              label="Pending Package Requests"
              value={v(stats?.pendingRequests ?? 0)}
              hint="Waiting for approval"
              href="/dashboard/package-requests"
              alert={!!stats?.pendingRequests}
            />
            <StatCard label="Open Support Tickets" value={v(stats?.openTickets ?? 0)} hint="Open or in progress" href="/dashboard/tickets" alert={!!stats?.openTickets} />
            <StatCard
              label="Unpaid Invoices"
              value={v(money(stats?.unpaid?.total ?? 0))}
              hint={stats?.unpaid ? `${stats.unpaid.count} invoice(s)` : undefined}
              href="/dashboard/invoices"
              alert={!!stats?.unpaid?.count}
            />
          </section>

          {/* Status breakdown + quick actions */}
          <section className="grid gap-6 lg:grid-cols-3">
            <div className={`${dCard} p-6 lg:col-span-2`}>
              <h2 className="text-sm font-semibold text-slate-200">Connection status</h2>
              {total === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{loading ? 'Loading...' : 'No customers yet. Create the first one to get started.'}</p>
              ) : (
                <>
                  <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-800" role="img" aria-label="Customers by connection status">
                    <div className="bg-emerald-500" style={{ width: pct(c!.active) }} />
                    <div className="bg-amber-500" style={{ width: pct(c!.suspended) }} />
                    <div className="bg-red-500" style={{ width: pct(c!.disconnected) }} />
                  </div>
                  <ul className="mt-4 grid grid-cols-3 gap-4 text-sm">
                    {[
                      ['Active', c!.active, 'bg-emerald-500'],
                      ['Suspended', c!.suspended, 'bg-amber-500'],
                      ['Disconnected', c!.disconnected, 'bg-red-500'],
                    ].map(([label, n, color]) => (
                      <li key={label as string} className="flex items-center gap-2 text-slate-300">
                        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        {label} <span className="font-semibold text-slate-100">{n}</span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>

            <div className={`${dCard} p-6`}>
              <h2 className="text-sm font-semibold text-slate-200">Quick actions</h2>
              <div className="mt-4 grid gap-2">
                <Link href="/dashboard/customers" className="rounded-xl bg-slate-100 px-4 py-2.5 text-center text-sm font-semibold text-slate-950 hover:bg-slate-200 transition">
                  + Create Customer
                </Link>
                <Link href="/dashboard/invoices" className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-slate-200 hover:bg-slate-800 transition">
                  New Invoice
                </Link>
                <Link href="/dashboard/tickets" className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-2.5 text-center text-sm font-medium text-slate-200 hover:bg-slate-800 transition">
                  Reply to Tickets
                </Link>
              </div>
            </div>
          </section>

          {/* Recent activity */}
          <section className="grid gap-6 lg:grid-cols-2">
            <div className={`${dCard} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-200">Newest customers</h2>
                <Link href="/dashboard/customers" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">View all</Link>
              </div>
              {!stats?.recentCustomers?.length ? (
                <p className="px-6 py-8 text-sm text-slate-500">{loading ? 'Loading...' : 'No customers yet.'}</p>
              ) : (
                <ul className="divide-y divide-slate-800/60">
                  {stats.recentCustomers.map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-200">{r.name}</p>
                        <p className="truncate text-xs text-slate-400">
                          <span className="font-mono">{r.customerId}</span> · {r.planName ?? 'No package'} · {date(r.createdAt)}
                        </p>
                      </div>
                      <DBadge value={r.status} />
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className={`${dCard} overflow-hidden`}>
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <h2 className="text-sm font-semibold text-slate-200">Pending package requests</h2>
                <Link href="/dashboard/package-requests" className="text-xs font-medium text-indigo-400 hover:text-indigo-300">Review</Link>
              </div>
              {!stats?.recentRequests?.length ? (
                <p className="px-6 py-8 text-sm text-slate-500">{loading ? 'Loading...' : 'Nothing waiting. You are all caught up.'}</p>
              ) : (
                <ul className="divide-y divide-slate-800/60">
                  {stats.recentRequests.map((r) => (
                    <li key={r.id} className="px-6 py-3.5">
                      <p className="text-sm font-medium text-slate-200">{r.customerName} <span className="font-mono text-xs font-normal text-slate-400">{r.customerId}</span></p>
                      <p className="text-xs text-slate-400">
                        {r.fromPlanName ?? 'None'} &rarr; <span className="text-slate-200">{r.toPlanName}</span> · {date(r.createdAt, true)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}

      {/* Website management (admin) */}
      {role === 'admin' && stats?.admin && (
        <section aria-label="Website" className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">Website</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
            <StatCard label="Customer Orders" value={stats.admin.totalOrders} hint={`${stats.admin.pendingOrders} pending`} href="/dashboard/orders" alert={stats.admin.pendingOrders > 0} />
            <StatCard label="Active Pricing Plans" value={stats.admin.plans} href="/dashboard/plans" />
            <StatCard label="Homepage Carousel" value={`${stats.admin.slides.active}/${stats.admin.slides.total}`} hint={stats.admin.slides.total ? 'Slides showing / total' : 'Using built-in default slides'} href="/dashboard/carousel" />
          </div>
        </section>
      )}
    </div>
  );
}
