'use client';

import { useState } from 'react';
import { http, errMsg } from '@/lib/http';
import { useCustomer } from '../../_components/CustomerProvider';
import { Alert, Badge, Card, PageHeader, btnPrimary, fmtDate, inputCls, labelCls } from '../../_components/ui';

export default function ProfilePage() {
  const { me, reload } = useCustomer();
  const [form, setForm] = useState(() => ({
    phone: me?.customer.phone ?? '',
    email: me?.customer.email ?? '',
    address: me?.customer.address ?? '',
  }));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  if (!me) return null;
  const { customer, plan } = me;

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      await http('/api/self-care/profile', { method: 'PUT', json: form });
      await reload();
      setMsg({ tone: 'success', text: 'Your contact details were updated.' });
    } catch (err) {
      setMsg({ tone: 'error', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const initials = customer.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      <PageHeader title="My Profile" subtitle="Your account information and contact details." />

      <Card>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand text-xl font-bold text-white">{initials}</div>
          <div>
            <h2 className="text-lg font-bold text-stone-900">{customer.name}</h2>
            <p className="font-mono text-sm text-stone-600">{customer.customerId}</p>
          </div>
        </div>
        <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
          <div><dt className={labelCls}>Package</dt><dd>{plan?.name ?? 'Not assigned'}</dd></div>
          <div><dt className={labelCls}>Status</dt><dd><Badge value={customer.status} /></dd></div>
          <div><dt className={labelCls}>Connected since</dt><dd>{fmtDate(customer.connectionDate)}</dd></div>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-1 text-lg font-bold text-brand">Contact details</h2>
        <p className="mb-5 text-sm text-stone-500">To change your name on record, please open a support ticket.</p>
        <form onSubmit={save} className="space-y-4">
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className={labelCls}>Phone</label>
              <input id="phone" required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label htmlFor="email" className={labelCls}>Email</label>
              <input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} placeholder="you@example.com" />
            </div>
          </div>
          <div>
            <label htmlFor="address" className={labelCls}>Address</label>
            <textarea id="address" rows={2} maxLength={300} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={inputCls} />
          </div>
          <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Saving...' : 'Save changes'}</button>
        </form>
      </Card>
    </div>
  );
}
