'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { CreditCard } from 'lucide-react';
import { http, errMsg } from '@/lib/http';
import type { InvoiceDTO } from '@/lib/types';
import { Alert, Badge, Card, PageHeader, Spinner, Stat, btnAccent, fmtDate, fmtMoney } from '../../_components/ui';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<InvoiceDTO[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    http<{ data: InvoiceDTO[] }>('/api/self-care/invoices')
      .then((r) => setInvoices(r.data))
      .catch((e) => setError(errMsg(e)));
  }, []);

  const unpaid = invoices?.filter((i) => i.status === 'Unpaid') ?? [];
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount, 0);
  const paidTotal = (invoices ?? []).filter((i) => i.status === 'Paid').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        subtitle="Your invoices and payment status."
        action={<Link href="/pay-bill" className={btnAccent}><CreditCard className="h-4 w-4" /> Pay bill</Link>}
      />

      {error && <Alert tone="error">{error}</Alert>}
      {!invoices && !error && <Spinner label="Loading invoices..." />}

      {invoices && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Outstanding" value={fmtMoney(unpaidTotal)} tone={unpaidTotal > 0 ? 'warn' : 'ok'} hint={`${unpaid.length} unpaid invoice(s)`} />
            <Stat label="Total paid" value={fmtMoney(paidTotal)} />
            <Stat label="Invoices" value={invoices.length} />
          </div>

          <Card className="p-0 sm:p-0">
            {invoices.length === 0 ? (
              <p className="p-6 text-sm text-stone-500">No invoices yet. They will appear here once billing starts.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-stone-200 bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Period</th><th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Due</th><th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {invoices.map((i) => (
                      <tr key={i._id}>
                        <td className="px-5 py-4 font-mono text-xs">{i.invoiceNo}</td>
                        <td className="px-5 py-4">{i.period}{i.planName && <span className="block text-xs text-stone-500">{i.planName}</span>}</td>
                        <td className="px-5 py-4 font-semibold">{fmtMoney(i.amount)}</td>
                        <td className="px-5 py-4 text-stone-600">{fmtDate(i.dueDate)}</td>
                        <td className="px-5 py-4">
                          <Badge value={i.status} />
                          {i.status === 'Paid' && <span className="mt-1 block text-xs text-stone-500">{fmtDate(i.paidAt)}{i.paymentMethod && ` · ${i.paymentMethod}`}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
