'use client';

import { useCallback, useEffect, useState } from 'react';
import { http, errMsg } from '@/lib/http';
import type { PackageRequestDTO } from '@/lib/types';
import { DBadge, DModal, StatusMsg, dBtnGhost, dBtnPrimary, dCard, dInput, dLabel, date, money } from '../_components/dark';

export default function PackageRequestsPage() {
  const [rows, setRows] = useState<PackageRequestDTO[]>([]);
  const [filter, setFilter] = useState<'Pending' | 'all'>('Pending');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [acting, setActing] = useState<{ req: PackageRequestDTO; action: 'approve' | 'reject' } | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await http<{ data: PackageRequestDTO[] }>(`/api/package-requests${filter === 'Pending' ? '?status=Pending' : ''}`);
      setRows(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!acting) return;
    setBusy(true);
    try {
      await http(`/api/package-requests/${acting.req._id}`, { method: 'PUT', json: { action: acting.action, staffNote: note } });
      setMsg({ type: 'success', text: acting.action === 'approve' ? 'Approved. The customer is now on the new package.' : 'Request rejected.' });
      setActing(null);
      setNote('');
      load();
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
      setActing(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Package Change Requests</h1>
          <p className="mt-1 text-sm text-slate-400">Approve or reject packages customers request from Self Care.</p>
        </div>
        <div className="flex rounded-xl border border-slate-800 bg-slate-900 p-1 text-sm">
          {(['Pending', 'all'] as const).map((f) => (
            <button key={f} onClick={() => { setFilter(f); setLoading(true); }} className={`cursor-pointer rounded-lg px-4 py-1.5 font-medium transition ${filter === f ? 'bg-slate-100 text-slate-950' : 'text-slate-400 hover:text-slate-200'}`}>
              {f === 'all' ? 'All' : 'Pending'}
            </button>
          ))}
        </div>
      </div>

      <StatusMsg msg={msg} />

      <div className={`${dCard} overflow-x-auto`}>
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
            <tr><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Change</th><th className="px-6 py-4">Requested</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {loading ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">Loading...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td colSpan={5} className="py-8 text-center text-slate-400">{filter === 'Pending' ? 'No pending requests.' : 'No requests yet.'}</td></tr>
            ) : (
              rows.map((r) => (
                <tr key={r._id} className="hover:bg-slate-800/30">
                  <td className="px-6 py-4"><p className="font-medium text-slate-200">{r.customerName}</p><p className="font-mono text-xs text-slate-400">{r.customerId}</p></td>
                  <td className="px-6 py-4 text-slate-300">
                    {r.fromPlanName ?? 'None'} <span className="text-slate-500">&rarr;</span> <strong className="text-slate-100">{r.toPlanName}</strong>
                    <span className="block text-xs text-[#ff6600] font-semibold">{money(r.toPrice)}/mo</span>
                    {r.note && <span className="mt-1 block text-xs italic text-slate-400">&ldquo;{r.note}&rdquo;</span>}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{date(r.createdAt, true)}</td>
                  <td className="px-6 py-4">
                    <DBadge value={r.status} />
                    {r.processedBy && <span className="mt-1 block text-xs text-slate-500">by {r.processedBy.name}</span>}
                    {r.staffNote && <span className="block text-xs text-slate-400">{r.staffNote}</span>}
                  </td>
                  <td className="space-x-3 whitespace-nowrap px-6 py-4 text-right">
                    {r.status === 'Pending' && (
                      <>
                        <button onClick={() => { setActing({ req: r, action: 'approve' }); setNote(''); }} className="cursor-pointer font-medium text-emerald-400 hover:text-emerald-300">Approve</button>
                        <button onClick={() => { setActing({ req: r, action: 'reject' }); setNote(''); }} className="cursor-pointer font-medium text-red-400 hover:text-red-300">Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {acting && (
        <DModal title={acting.action === 'approve' ? 'Approve package change' : 'Reject package change'} onClose={() => !busy && setActing(null)}>
          <p className="text-sm text-slate-300">
            {acting.req.customerName} ({acting.req.customerId}): {acting.req.fromPlanName ?? 'None'} &rarr; <strong>{acting.req.toPlanName}</strong>
          </p>
          <div className="mt-4">
            <label className={dLabel}>Note to customer (optional)</label>
            <textarea rows={3} maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className={dInput} placeholder={acting.action === 'reject' ? 'Reason for rejection' : 'e.g. Applied from next billing cycle'} />
          </div>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setActing(null)} disabled={busy} className={dBtnGhost}>Back</button>
            <button onClick={submit} disabled={busy} className={dBtnPrimary}>{busy ? 'Saving...' : acting.action === 'approve' ? 'Approve' : 'Reject'}</button>
          </div>
        </DModal>
      )}
    </div>
  );
}
