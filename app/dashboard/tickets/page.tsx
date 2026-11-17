'use client';

import { useCallback, useEffect, useState } from 'react';
import { http, errMsg } from '@/lib/http';
import type { TicketDTO } from '@/lib/types';
import { DBadge, StatusMsg, dBtnPrimary, dCard, dInput, date } from '../_components/dark';

const STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];

export default function TicketsPage() {
  const [list, setList] = useState<TicketDTO[]>([]);
  const [filter, setFilter] = useState('Open');
  const [active, setActive] = useState<TicketDTO | null>(null);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await http<{ data: TicketDTO[] }>(`/api/tickets${filter ? `?status=${encodeURIComponent(filter)}` : ''}`);
      setList(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const open = async (id: string) => {
    try {
      setActive((await http<{ data: TicketDTO }>(`/api/tickets/${id}`)).data);
    } catch (e) {
      setMsg({ type: 'error', text: errMsg(e) });
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    try {
      setActive((await http<{ data: TicketDTO }>(`/api/tickets/${active._id}`, { method: 'POST', json: { text: reply } })).data);
      setReply('');
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (status: string) => {
    if (!active) return;
    try {
      const r = await http<{ data: TicketDTO }>(`/api/tickets/${active._id}`, { method: 'PUT', json: { status } });
      setActive((a) => (a ? { ...a, status: r.data.status } : a));
      load();
    } catch (err) {
      setMsg({ type: 'error', text: errMsg(err) });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Support Tickets</h1>
          <p className="mt-1 text-sm text-slate-400">Reply to customers and update ticket status.</p>
        </div>
        <select value={filter} onChange={(e) => { setFilter(e.target.value); setLoading(true); }} className={`${dInput} sm:w-48`}>
          <option value="">All tickets</option>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      <StatusMsg msg={msg} />

      <div className="grid gap-6 lg:grid-cols-5">
        <div className={`${dCard} overflow-hidden lg:col-span-2`}>
          {loading ? (
            <p className="p-6 text-sm text-slate-400">Loading...</p>
          ) : list.length === 0 ? (
            <p className="p-6 text-sm text-slate-400">No tickets.</p>
          ) : (
            <ul className="max-h-[600px] divide-y divide-slate-800/60 overflow-y-auto">
              {list.map((t) => (
                <li key={t._id}>
                  <button onClick={() => open(t._id)} className={`w-full cursor-pointer px-5 py-4 text-left transition hover:bg-slate-800/40 ${active?._id === t._id ? 'bg-slate-800/60' : ''}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-slate-100">{t.subject}</span>
                      <DBadge value={t.status} />
                    </div>
                    <p className="mt-1 text-xs text-slate-400">{t.customerName} · <span className="font-mono">{t.customerId}</span></p>
                    <p className="text-xs text-slate-500">{t.ticketNo} · {t.category} · {date(t.updatedAt, true)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={`${dCard} p-5 lg:col-span-3`}>
          {!active ? (
            <p className="py-16 text-center text-sm text-slate-400">Select a ticket to view the conversation.</p>
          ) : (
            <div className="flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-100">{active.subject}</h2>
                  <p className="text-xs text-slate-400">{active.ticketNo} · {active.customerName} ({active.customerId}) · {active.category}</p>
                </div>
                <select value={active.status} onChange={(e) => setStatus(e.target.value)} className="cursor-pointer rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:outline-none">
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>

              <div className="max-h-[360px] space-y-3 overflow-y-auto py-4">
                {active.messages?.map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'staff' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${m.sender === 'staff' ? 'rounded-br-sm bg-indigo-600 text-white' : 'rounded-bl-sm bg-slate-800 text-slate-100'}`}>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className="mt-1 text-[11px] opacity-60">{m.name} · {date(m.createdAt, true)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {active.status === 'Closed' ? (
                <p className="text-sm text-slate-400">This ticket is closed. Re-open it by changing the status.</p>
              ) : (
                <form onSubmit={send} className="flex gap-2 border-t border-slate-800 pt-4">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={2000} placeholder="Write a reply to the customer..." className={dInput} />
                  <button type="submit" disabled={busy || reply.trim().length < 2} className={dBtnPrimary}>Send</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
