'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { http, errMsg } from '@/lib/http';
import type { CustomerRow, CustomerStatus, PlanDTO } from '@/lib/types';
import { DBadge, DModal, StatusMsg, dBtnGhost, dBtnPrimary, dCard, dInput, dLabel, date, money, useStaffRole } from '../_components/dark';

interface Credentials {
  customerId: string;
  temporaryPassword: string;
  name: string;
  phone: string;
  reset?: boolean;
}

const plusDays = (days: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

const emptyForm = () => ({ name: '', phone: '', email: '', address: '', planId: '', status: 'Active' as CustomerStatus, nextBillingDate: plusDays(30) });

export default function CustomersPage() {
  const role = useStaffRole();
  const [rows, setRows] = useState<CustomerRow[]>([]);
  const [plans, setPlans] = useState<PlanDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const [modal, setModal] = useState<'create' | 'edit' | null>(null);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [copied, setCopied] = useState('');

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (q) params.set('q', q);
      if (statusFilter) params.set('status', statusFilter);
      const r = await http<{ data: CustomerRow[] }>(`/api/customers?${params}`);
      setRows(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250); // debounce search typing
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    http<{ data: PlanDTO[] }>('/api/plans').then((r) => setPlans(r.data)).catch(() => {});
  }, []);

  const stats = useMemo(
    () => ({
      total: rows.length,
      active: rows.filter((r) => r.status === 'Active').length,
      suspended: rows.filter((r) => r.status === 'Suspended').length,
    }),
    [rows]
  );

  const openCreate = () => {
    setForm(emptyForm());
    setEditing(null);
    setFormError('');
    setModal('create');
  };

  const openEdit = (c: CustomerRow) => {
    setEditing(c);
    setForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      address: c.address,
      planId: c.planId ?? '',
      status: c.status,
      nextBillingDate: c.nextBillingDate ? c.nextBillingDate.slice(0, 10) : '',
    });
    setFormError('');
    setModal('edit');
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (modal === 'create') {
        const r = await http<{ credentials: { customerId: string; temporaryPassword: string } }>('/api/customers', { method: 'POST', json: form });
        setCreds({ ...r.credentials, name: form.name, phone: form.phone });
      } else if (editing) {
        await http(`/api/customers/${editing.id}`, { method: 'PUT', json: form });
        setMsg({ type: 'success', text: 'Customer updated.' });
      }
      setModal(null);
      load();
    } catch (err) {
      setFormError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  const resetPassword = async (c: CustomerRow) => {
    if (!confirm(`Generate a NEW temporary password for ${c.name} (${c.customerId})? Their current password stops working and they will be signed out.`)) return;
    try {
      const r = await http<{ credentials: { customerId: string; temporaryPassword: string } }>(`/api/customers/${c.id}/reset-password`, { method: 'POST' });
      setCreds({ ...r.credentials, name: c.name, phone: c.phone, reset: true });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  const remove = async (c: CustomerRow) => {
    if (!confirm(`Delete ${c.name} (${c.customerId})? This also deletes their invoices, tickets and package requests.`)) return;
    try {
      await http(`/api/customers/${c.id}`, { method: 'DELETE' });
      setMsg({ type: 'success', text: 'Customer deleted.' });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  const quickStatus = async (c: CustomerRow, status: CustomerStatus) => {
    try {
      await http(`/api/customers/${c.id}`, { method: 'PUT', json: { status } });
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  /* ---- credential sharing ---- */
  const loginUrl = typeof window !== 'undefined' ? `${window.location.origin}/self-care/login` : '/self-care/login';
  const shareText = creds
    ? `A1 Communication - Self Care Portal\nName: ${creds.name}\nCustomer ID: ${creds.customerId}\nTemporary Password: ${creds.temporaryPassword}\nLogin: ${loginUrl}\nPlease change your password after your first login.`
    : '';
  const digits = creds?.phone.replace(/\D/g, '') ?? '';
  const waNumber = /^01\d{9}$/.test(digits) ? `88${digits}` : digits;

  const copy = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(''), 1800);
    } catch {
      setCopied('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Customers</h1>
          <p className="mt-1 text-sm text-slate-400">Create Self Care accounts (ID starts with A1C) and manage customer connections.</p>
        </div>
        <button onClick={openCreate} className={`${dBtnPrimary} self-start sm:self-auto`}>+ Create Customer</button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[['Total', stats.total], ['Active', stats.active], ['Suspended', stats.suspended]].map(([k, v]) => (
          <div key={k as string} className={`${dCard} p-4`}>
            <p className="text-xs uppercase tracking-wider text-slate-400">{k}</p>
            <p className="mt-1 text-2xl font-bold text-slate-100">{v}</p>
          </div>
        ))}
      </div>

      <StatusMsg msg={msg} />

      <div className={`${dCard} overflow-hidden shadow-2xl`}>
        <div className="flex flex-col gap-3 border-b border-slate-800 p-4 sm:flex-row">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by ID, name, phone or email..." className={`${dInput} sm:w-80`} />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${dInput} sm:w-48`}>
            <option value="">All statuses</option>
            <option>Active</option>
            <option>Suspended</option>
            <option>Disconnected</option>
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-medium uppercase tracking-wider text-slate-400">
                <th className="px-6 py-4">Customer ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Package</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Next billing</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">Loading customers...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-slate-400">No customers found.</td></tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-800/30">
                    <td className="px-6 py-4 font-mono text-slate-200">
                      {c.customerId}
                      {c.mustChangePassword && <span className="mt-1 block font-sans text-[10px] uppercase tracking-wide text-amber-400">Temp password active</span>}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-slate-200">{c.name}</p>
                      <p className="text-xs text-slate-400">{c.phone}{c.email && ` · ${c.email}`}</p>
                    </td>
                    <td className="px-6 py-4 text-slate-300">
                      {c.planName ?? <span className="text-slate-500">None</span>}
                      {c.planPrice != null && <span className="block text-xs text-[#ff6600] font-semibold">{money(c.planPrice)}/mo</span>}
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.status}
                        onChange={(e) => quickStatus(c, e.target.value as CustomerStatus)}
                        aria-label={`Status for ${c.customerId}`}
                        className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950 px-2 py-1 text-xs text-slate-200 focus:outline-none"
                      >
                        <option>Active</option>
                        <option>Suspended</option>
                        <option>Disconnected</option>
                      </select>
                      <div className="mt-1"><DBadge value={c.status} /></div>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{date(c.nextBillingDate)}</td>
                    <td className="space-x-3 whitespace-nowrap px-6 py-4 text-right">
                      <button onClick={() => openEdit(c)} className="cursor-pointer font-medium text-indigo-400 transition hover:text-indigo-300">Edit</button>
                      <button onClick={() => resetPassword(c)} className="cursor-pointer font-medium text-amber-400 transition hover:text-amber-300">Reset password</button>
                      {role === 'admin' && (
                        <button onClick={() => remove(c)} className="cursor-pointer font-medium text-red-400 transition hover:text-red-300">Delete</button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit */}
      {modal && (
        <DModal title={modal === 'create' ? 'Create Customer Account' : `Edit ${editing?.customerId}`} onClose={() => setModal(null)} wide>
          <form onSubmit={save} className="space-y-4">
            {formError && <StatusMsg msg={{ type: 'error', text: formError }} />}
            {modal === 'create' && (
              <p className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-400">
                A Customer ID (A1C + 6 digits) and a temporary password are generated automatically when you save. The customer must change the password on first login.
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={dLabel}>Full name *</label>
                <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={dInput} />
              </div>
              <div>
                <label className={dLabel}>Phone *</label>
                <input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className={dInput} placeholder="01XXXXXXXXX" />
              </div>
              <div>
                <label className={dLabel}>Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={dInput} />
              </div>
              <div>
                <label className={dLabel}>Package</label>
                <select value={form.planId} onChange={(e) => setForm({ ...form, planId: e.target.value })} className={dInput}>
                  <option value="">No package yet</option>
                  {plans.map((p) => <option key={p.id} value={p.id}>{p.name} ({money(p.price)})</option>)}
                </select>
              </div>
              <div>
                <label className={dLabel}>Connection status</label>
                <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CustomerStatus })} className={dInput}>
                  <option>Active</option><option>Suspended</option><option>Disconnected</option>
                </select>
              </div>
              <div>
                <label className={dLabel}>Next billing date</label>
                <input type="date" value={form.nextBillingDate} onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })} className={dInput} />
              </div>
            </div>
            <div>
              <label className={dLabel}>Address</label>
              <textarea rows={2} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className={dInput} />
            </div>
            <div className="flex justify-end gap-3 border-t border-slate-800 pt-4">
              <button type="button" onClick={() => setModal(null)} className={dBtnGhost}>Cancel</button>
              <button type="submit" disabled={saving} className={dBtnPrimary}>{saving ? 'Saving...' : modal === 'create' ? 'Create & generate password' : 'Save changes'}</button>
            </div>
          </form>
        </DModal>
      )}

      {/* One-time credentials */}
      {creds && (
        <DModal title={creds.reset ? 'New temporary password' : 'Customer account created'} onClose={() => setCreds(null)} wide>
          <div className="space-y-4">
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
              Share these credentials with <strong>{creds.name}</strong> now. The password is stored encrypted and <strong>cannot be shown again</strong>. Use &quot;Reset password&quot; to issue a new one.
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ['Customer ID', creds.customerId],
                ['Temporary password', creds.temporaryPassword],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
                  <p className="mt-1 break-all font-mono text-lg text-slate-100">{value}</p>
                  <button onClick={() => copy(label, value)} className="mt-2 cursor-pointer text-xs font-medium text-indigo-400 hover:text-indigo-300">
                    {copied === label ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              ))}
            </div>

            <pre className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-300">{shareText}</pre>

            <div className="flex flex-wrap gap-3">
              <button onClick={() => copy('msg', shareText)} className={dBtnPrimary}>{copied === 'msg' ? 'Copied!' : 'Copy full message'}</button>
              {waNumber && (
                <a href={`https://wa.me/${waNumber}?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className={dBtnGhost}>Send via WhatsApp</a>
              )}
              {digits && <a href={`sms:${digits}?body=${encodeURIComponent(shareText)}`} className={dBtnGhost}>Send via SMS</a>}
              <button onClick={() => window.print()} className={dBtnGhost}>Print</button>
            </div>

            <div className="flex justify-end border-t border-slate-800 pt-4">
              <button onClick={() => setCreds(null)} className={dBtnGhost}>I have shared it - Close</button>
            </div>
          </div>
        </DModal>
      )}
    </div>
  );
}
