'use client';

import { useCallback, useEffect, useState } from 'react';
import { http, errMsg } from '@/lib/http';
import type { CustomerRow, InvoiceDTO } from '@/lib/types';
import { DBadge, DModal, StatusMsg, dBtnGhost, dBtnPrimary, dCard, dInput, dLabel, date, money, useStaffRole } from '../_components/dark';

const plusDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};
const thisMonth = () => new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });

export default function InvoicesPage() {
  const role = useStaffRole();
  const [rows, setRows] = useState<InvoiceDTO[]>([]);
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ customer: '', period: thisMonth(), amount: '', dueDate: plusDays(7) });
  const [formError, setFormError] = useState('');
  const [paying, setPaying] = useState<InvoiceDTO | null>(null);
  const [method, setMethod] = useState('Cash');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await http<{ data: InvoiceDTO[] }>(`/api/invoices${status ? `?status=${status}` : ''}`);
      setRows(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    http<{ data: CustomerRow[] }>('/api/customers').then((r) => setCustomers(r.data)).catch(() => {});
  }, []);

  const pickCustomer = (id: string) => {
    const c = customers.find((x) => x.id === id);
    setForm((f) => ({ ...f, customer: id, amount: c?.planPrice != null ? String(c.planPrice) : f.amount }));
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setFormError('');
    try {
      await http('/api/invoices', { method: 'POST', json: { ...form, amount: Number(form.amount) } });
      setCreating(false);
      setForm({ customer: '', period: thisMonth(), amount: '', dueDate: plusDays(7) });
      setMsg({ type: 'success', text: 'Invoice created.' });
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const setPaid = async (inv: InvoiceDTO, paid: boolean) => {
    setBusy(true);
    try {
      await http(`/api/invoices/${inv._id}`, { method: 'PUT', json: { status: paid ? 'Paid' : 'Unpaid', paymentMethod: method } });
      setPaying(null);
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (inv: InvoiceDTO) => {
    if (!confirm(`Delete invoice ${inv.invoiceNo}?`)) return;
    try {
      await http(`/api/invoices/${inv._id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Billing</h1>
          <p className="mt-1 text-sm text-slate-400">Create invoices and record payments. Customers see them in Self Care.</p>
        </div>
        <button onClick={() => { setCreating(true); setFormError(''); }} className={`${dBtnPrimary} self-start sm:self-auto`}>+ New Invoice</button>
      </div>

      <StatusMsg msg={msg} />

      <div className={`${dCard} overflow-hidden`}>
        <div className="border-b border-slate-800 p-4">
          <select value={status} onChange={(e) => { setStatus(e.target.value); setLoading(true); }} className={`${dInput} sm:w-48`}>
            <option value="">All invoices</option><option>Unpaid</option><option>Paid</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-slate-800 bg-slate-950/40 text-xs uppercase tracking-wider text-slate-400">
              <tr><th className="px-6 py-4">Invoice</th><th className="px-6 py-4">Customer</th><th className="px-6 py-4">Period</th><th className="px-6 py-4">Amount</th><th className="px-6 py-4">Due</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-slate-400">No invoices.</td></tr>
              ) : (
                rows.map((i) => (
                  <tr key={i._id} className="hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{i.invoiceNo}</td>
                    <td className="px-6 py-4"><p className="text-slate-200">{i.customerName}</p><p className="font-mono text-xs text-slate-400">{i.customerId}</p></td>
                    <td className="px-6 py-4 text-slate-300">{i.period}</td>
                    <td className="px-6 py-4 font-semibold text-slate-100">{money(i.amount)}</td>
                    <td className="px-6 py-4 text-slate-400">{date(i.dueDate)}</td>
                    <td className="px-6 py-4">
                      <DBadge value={i.status} />
                      {i.status === 'Paid' && <span className="mt-1 block text-xs text-slate-500">{date(i.paidAt)} · {i.paymentMethod}</span>}
                    </td>
                    <td className="space-x-3 whitespace-nowrap px-6 py-4 text-right">
                      {i.status === 'Unpaid' ? (
                        <button onClick={() => { setPaying(i); setMethod('Cash'); }} className="cursor-pointer font-medium text-emerald-400 hover:text-emerald-300">Mark paid</button>
                      ) : (
                        <button onClick={() => setPaid(i, false)} className="cursor-pointer font-medium text-amber-400 hover:text-amber-300">Mark unpaid</button>
                      )}
                      {role === 'admin' && <button onClick={() => remove(i)} className="cursor-pointer font-medium text-red-400 hover:text-red-300">Delete</button>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {creating && (
        <DModal title="Create invoice" onClose={() => setCreating(false)}>
          <form onSubmit={create} className="space-y-4">
            {formError && <StatusMsg msg={{ type: 'error', text: formError }} />}
            <div>
              <label className={dLabel}>Customer *</label>
              <select required value={form.customer} onChange={(e) => pickCustomer(e.target.value)} className={dInput}>
                <option value="">Select customer...</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.customerId} - {c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={dLabel}>Billing period *</label><input required value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className={dInput} /></div>
              <div><label className={dLabel}>Amount (৳) *</label><input required type="number" min={0} value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={dInput} /></div>
            </div>
            <div><label className={dLabel}>Due date *</label><input required type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className={dInput} /></div>
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setCreating(false)} className={dBtnGhost}>Cancel</button>
              <button type="submit" disabled={busy} className={dBtnPrimary}>{busy ? 'Saving...' : 'Create invoice'}</button>
            </div>
          </form>
        </DModal>
      )}

      {paying && (
        <DModal title={`Mark ${paying.invoiceNo} as paid`} onClose={() => setPaying(null)}>
          <label className={dLabel}>Payment method</label>
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={dInput}>
            {['Cash', 'bKash', 'Nagad', 'Rocket', 'Bank transfer', 'Other'].map((m) => <option key={m}>{m}</option>)}
          </select>
          <div className="mt-5 flex justify-end gap-3">
            <button onClick={() => setPaying(null)} className={dBtnGhost}>Cancel</button>
            <button onClick={() => setPaid(paying, true)} disabled={busy} className={dBtnPrimary}>{busy ? 'Saving...' : 'Confirm payment'}</button>
          </div>
        </DModal>
      )}
    </div>
  );
}
