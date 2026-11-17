'use client';

import Link from 'next/link';
import { ArrowRight, CalendarClock, Check, CreditCard, LifeBuoy, ReceiptText, Wifi } from 'lucide-react';
import { useCustomer } from '../_components/CustomerProvider';
import { Alert, Badge, Card, Stat, btnAccent, btnGhost, daysUntil, fmtDate, fmtMoney } from '../_components/ui';

export default function OverviewPage() {
  const { me } = useCustomer();
  if (!me) return null;
  const { customer, plan, summary } = me;

  const days = daysUntil(customer.nextBillingDate);
  const billingHint =
    days === null ? 'Not scheduled yet' : days < 0 ? `${Math.abs(days)} day(s) overdue` : days === 0 ? 'Due today' : `In ${days} day(s)`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-stone-500">Welcome back,</p>
        <h1 className="text-2xl font-bold tracking-tight text-brand sm:text-3xl">{customer.name}</h1>
      </div>

      {customer.status === 'Suspended' && (
        <Alert tone="warning">
          Your connection is <strong>suspended</strong>. Please clear any outstanding bill or contact support to get back online.
        </Alert>
      )}
      {customer.status === 'Disconnected' && (
        <Alert tone="error">
          Your connection is <strong>disconnected</strong>. Open a support ticket to request reconnection.
        </Alert>
      )}
      {summary.pendingRequest && (
        <Alert tone="info">
          Your request to switch to <strong>{summary.pendingRequest.toPlanName}</strong> is waiting for approval.{' '}
          <Link href="/self-care/package" className="font-semibold underline">View status</Link>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Current package" value={plan?.name ?? 'Not assigned'} hint={plan ? `${fmtMoney(plan.price)} / month` : 'Contact support to get started'} />
        <Stat label="Connection status" value={<Badge value={customer.status} />} hint={`Connected since ${fmtDate(customer.connectionDate)}`} />
        <Stat label="Next billing" value={fmtDate(customer.nextBillingDate)} hint={billingHint} tone={days !== null && days < 0 ? 'warn' : undefined} />
        <Stat
          label="Outstanding"
          value={fmtMoney(summary.unpaidTotal)}
          hint={summary.unpaidCount ? `${summary.unpaidCount} unpaid invoice(s)` : 'All paid. Thank you!'}
          tone={summary.unpaidTotal > 0 ? 'warn' : 'ok'}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand"><Wifi className="h-5 w-5" /></span>
              <div>
                <h2 className="text-lg font-bold text-brand">{plan?.name ?? 'No package assigned'}</h2>
                {plan && <p className="text-sm text-stone-600"><span className="font-semibold text-accent-dark">{fmtMoney(plan.price)}</span> per month</p>}
              </div>
            </div>
            <Link href="/self-care/package" className={btnAccent}>Change package <ArrowRight className="h-4 w-4" /></Link>
          </div>

          {plan && (
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {f}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-4 text-lg font-bold text-brand">Quick actions</h2>
          <div className="grid gap-2">
            <Link href="/pay-bill" className={btnGhost}><CreditCard className="h-4 w-4" /> Pay bill</Link>
            <Link href="/self-care/billing" className={btnGhost}><ReceiptText className="h-4 w-4" /> View invoices</Link>
            <Link href="/self-care/support" className={btnGhost}>
              <LifeBuoy className="h-4 w-4" /> Get support{summary.openTickets > 0 && ` (${summary.openTickets} open)`}
            </Link>
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-brand"><CalendarClock className="h-5 w-5" /> Account details</h2>
        <dl className="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Customer ID', <span key="i" className="font-mono font-semibold">{customer.customerId}</span>],
            ['Phone', customer.phone],
            ['Email', customer.email || '-'],
            ['Address', customer.address || '-'],
            ['Last sign-in', fmtDate(customer.lastLoginAt, true)],
            ['Account created', fmtDate(customer.createdAt)],
          ].map(([k, v], i) => (
            <div key={i}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">{k as string}</dt>
              <dd className="mt-1 text-stone-900">{v}</dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
