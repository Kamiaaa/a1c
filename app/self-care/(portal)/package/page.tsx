'use client';

import { useCallback, useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, Check } from 'lucide-react';
import { http, errMsg } from '@/lib/http';
import type { PackageRequestDTO, PlanDTO } from '@/lib/types';
import { useCustomer } from '../../_components/CustomerProvider';
import { Alert, Badge, Card, Modal, PageHeader, Spinner, btnAccent, btnGhost, btnPrimary, cx, fmtDate, fmtMoney, inputCls, labelCls } from '../../_components/ui';

export default function PackagePage() {
  const { me, reload } = useCustomer();
  const [plans, setPlans] = useState<PlanDTO[] | null>(null);
  const [history, setHistory] = useState<PackageRequestDTO[]>([]);
  const [target, setTarget] = useState<PlanDTO | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    const [p, h] = await Promise.all([
      http<{ data: PlanDTO[] }>('/api/plans'),
      http<{ data: PackageRequestDTO[] }>('/api/self-care/package-requests'),
    ]);
    setPlans([...p.data].sort((a, b) => a.price - b.price));
    setHistory(h.data);
  }, []);

  useEffect(() => {
    load().catch((e) => setError(errMsg(e)));
  }, [load]);

  if (!me) return null;
  const current = me.plan;
  const pending = me.summary.pendingRequest;
  const blocked = me.customer.status === 'Disconnected';

  const submit = async () => {
    if (!target) return;
    setBusy(true);
    setError('');
    try {
      const res = await http<{ applied: boolean }>('/api/self-care/package-requests', {
        method: 'POST',
        json: { planId: target.id, note },
      });
      setNotice(
        res.applied
          ? `Done! You are now on ${target.name}.`
          : `Request sent. We will review your change to ${target.name} and update the status here.`
      );
      setTarget(null);
      setNote('');
      await Promise.all([load(), reload()]);
    } catch (e) {
      setError(errMsg(e));
      setTarget(null);
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id: string) => {
    if (!confirm('Cancel this package change request?')) return;
    try {
      await http(`/api/self-care/package-requests/${id}`, { method: 'DELETE' });
      setNotice('Request cancelled.');
      await Promise.all([load(), reload()]);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="My Package" subtitle="See what you are on and request a different package." />

      {notice && <Alert tone="success">{notice}</Alert>}
      {error && <Alert tone="error">{error}</Alert>}
      {blocked && <Alert tone="warning">Your connection is disconnected, so package changes are unavailable. Please contact support.</Alert>}

      <Card>
        <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Current package</p>
        {current ? (
          <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-brand">{current.name}</h2>
              <p className="text-sm text-stone-600">{current.features.join(' · ')}</p>
            </div>
            <p className="text-2xl font-bold text-accent-dark">{fmtMoney(current.price)}<span className="text-sm font-medium text-stone-500"> / month</span></p>
          </div>
        ) : (
          <p className="mt-2 text-stone-600">No package is assigned yet. Choose one below and we will set it up.</p>
        )}
      </Card>

      {pending && (
        <Alert tone="info" className="flex flex-wrap items-center justify-between gap-3">
          <span>
            Pending request: <strong>{pending.toPlanName}</strong> (sent {fmtDate(pending.createdAt)}). You can submit a new one after it is processed or cancelled.
          </span>
          <button onClick={() => cancel(pending.id)} className="font-semibold underline">Cancel request</button>
        </Alert>
      )}

      <div>
        <h2 className="mb-3 text-lg font-bold text-brand">Available packages</h2>
        {!plans ? (
          <Spinner label="Loading packages..." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((p) => {
              const isCurrent = p.id === current?.id;
              const diff = current ? p.price - current.price : 0;
              return (
                <div key={p.id} className={cx('flex flex-col rounded-2xl border bg-white p-5 shadow-sm', isCurrent ? 'border-brand ring-2 ring-brand/20' : 'border-stone-200')}>
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold text-brand">{p.name}</h3>
                    {isCurrent && <span className="rounded-full bg-brand px-2.5 py-0.5 text-xs font-semibold text-white">Current</span>}
                  </div>
                  <p className="mt-1 text-2xl font-bold text-accent-dark">{fmtMoney(p.price)}<span className="text-sm font-medium text-stone-500"> / month</span></p>
                  <ul className="my-4 flex-1 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <button disabled className={btnGhost}>Your package</button>
                  ) : (
                    <button disabled={!!pending || blocked} onClick={() => { setTarget(p); setError(''); setNotice(''); }} className={btnPrimary}>
                      {current && (diff > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />)}
                      {current ? (diff > 0 ? 'Upgrade' : 'Downgrade') : 'Choose'} to this package
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Card>
        <h2 className="mb-4 text-lg font-bold text-brand">Request history</h2>
        {history.length === 0 ? (
          <p className="text-sm text-stone-500">You have not requested any package changes yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-stone-200 text-xs uppercase tracking-wide text-stone-500">
                <tr><th className="py-2 pr-4">Date</th><th className="py-2 pr-4">Change</th><th className="py-2 pr-4">Status</th><th className="py-2">Staff note</th></tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {history.map((r) => (
                  <tr key={r._id}>
                    <td className="py-3 pr-4 text-stone-600">{fmtDate(r.createdAt)}</td>
                    <td className="py-3 pr-4">{r.fromPlanName ?? 'None'} &rarr; <strong>{r.toPlanName}</strong> <span className="text-stone-500">({fmtMoney(r.toPrice)})</span></td>
                    <td className="py-3 pr-4"><Badge value={r.status} /></td>
                    <td className="py-3 text-stone-600">{r.staffNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {target && (
        <Modal title="Confirm package change" onClose={() => !busy && setTarget(null)}>
          <p className="text-sm text-stone-700">
            {current ? <>{current.name} ({fmtMoney(current.price)}) &rarr; </> : 'New package: '}
            <strong>{target.name}</strong> ({fmtMoney(target.price)} / month)
          </p>
          <p className="mt-2 text-sm text-stone-500">Our team will review your request. You can follow its status on this page.</p>
          <div className="mt-4">
            <label htmlFor="note" className={labelCls}>Note (optional)</label>
            <textarea id="note" rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={inputCls} placeholder="e.g. Please apply from next month" />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setTarget(null)} disabled={busy} className={btnGhost}>Back</button>
            <button onClick={submit} disabled={busy} className={btnAccent}>{busy ? 'Sending...' : 'Send request'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
