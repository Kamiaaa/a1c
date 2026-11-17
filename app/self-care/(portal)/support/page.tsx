'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Plus, Send } from 'lucide-react';
import { http, errMsg } from '@/lib/http';
import type { TicketDTO } from '@/lib/types';
import { Alert, Badge, Card, PageHeader, Spinner, btnAccent, btnGhost, btnPrimary, cx, fmtDate, inputCls, labelCls } from '../../_components/ui';

const CATEGORIES = ['Connection Issue', 'Slow Speed', 'Billing', 'Package', 'Other'];

export default function SupportPage() {
  const [tickets, setTickets] = useState<TicketDTO[] | null>(null);
  const [active, setActive] = useState<TicketDTO | null>(null);
  const [composing, setComposing] = useState(false);
  const [form, setForm] = useState({ subject: '', category: 'Connection Issue', message: '' });
  const [reply, setReply] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  const loadList = useCallback(async () => {
    const r = await http<{ data: TicketDTO[] }>('/api/self-care/tickets');
    setTickets(r.data);
  }, []);

  useEffect(() => {
    loadList().catch((e) => setError(errMsg(e)));
  }, [loadList]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [active?.messages?.length]);

  const open = async (id: string) => {
    setError('');
    setComposing(false);
    try {
      setActive((await http<{ data: TicketDTO }>(`/api/self-care/tickets/${id}`)).data);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await http<{ data: TicketDTO }>('/api/self-care/tickets', { method: 'POST', json: form });
      setForm({ subject: '', category: 'Connection Issue', message: '' });
      setComposing(false);
      setActive(r.data);
      await loadList();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!active) return;
    setBusy(true);
    setError('');
    try {
      const r = await http<{ data: TicketDTO }>(`/api/self-care/tickets/${active._id}`, { method: 'POST', json: { text: reply } });
      setActive(r.data);
      setReply('');
      await loadList();
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Support"
        subtitle="Having trouble? Open a ticket and we will get back to you here."
        action={<button onClick={() => { setComposing(true); setActive(null); setError(''); }} className={btnAccent}><Plus className="h-4 w-4" /> New ticket</button>}
      />
      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="p-0 sm:p-0 lg:col-span-2">
          <div className="border-b border-stone-200 px-5 py-3 text-sm font-semibold text-brand">Your tickets</div>
          {!tickets ? (
            <div className="px-5"><Spinner /></div>
          ) : tickets.length === 0 ? (
            <p className="px-5 py-8 text-sm text-stone-500">No tickets yet.</p>
          ) : (
            <ul className="max-h-[520px] divide-y divide-stone-100 overflow-y-auto">
              {tickets.map((t) => (
                <li key={t._id}>
                  <button onClick={() => open(t._id)} className={cx('w-full px-5 py-4 text-left transition hover:bg-stone-50', active?._id === t._id && 'bg-brand/5')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-stone-900">{t.subject}</span>
                      <Badge value={t.status} />
                    </div>
                    <p className="mt-1 text-xs text-stone-500">{t.ticketNo} · {t.category} · {fmtDate(t.updatedAt)}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="lg:col-span-3">
          {composing ? (
            <Card>
              <h2 className="mb-4 text-lg font-bold text-brand">New support ticket</h2>
              <form onSubmit={create} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="cat" className={labelCls}>Category</label>
                    <select id="cat" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputCls}>
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="sub" className={labelCls}>Subject</label>
                    <input id="sub" required minLength={3} maxLength={120} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className={inputCls} placeholder="Short summary" />
                  </div>
                </div>
                <div>
                  <label htmlFor="msg" className={labelCls}>Describe the problem</label>
                  <textarea id="msg" required minLength={5} maxLength={2000} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className={inputCls} placeholder="What is happening and since when?" />
                </div>
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={() => setComposing(false)} className={btnGhost}>Cancel</button>
                  <button type="submit" disabled={busy} className={btnPrimary}>{busy ? 'Submitting...' : 'Submit ticket'}</button>
                </div>
              </form>
            </Card>
          ) : active ? (
            <Card className="flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-stone-200 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-brand">{active.subject}</h2>
                  <p className="text-xs text-stone-500">{active.ticketNo} · {active.category} · opened {fmtDate(active.createdAt)}</p>
                </div>
                <Badge value={active.status} />
              </div>

              <div className="max-h-[380px] space-y-3 overflow-y-auto py-4">
                {active.messages?.map((m, i) => (
                  <div key={i} className={cx('flex', m.sender === 'customer' ? 'justify-end' : 'justify-start')}>
                    <div className={cx('max-w-[85%] rounded-2xl px-4 py-3 text-sm', m.sender === 'customer' ? 'rounded-br-sm bg-brand text-white' : 'rounded-bl-sm bg-stone-100 text-stone-900')}>
                      <p className="whitespace-pre-wrap break-words">{m.text}</p>
                      <p className={cx('mt-1 text-[11px]', m.sender === 'customer' ? 'text-white/60' : 'text-stone-500')}>
                        {m.sender === 'staff' ? `${m.name} (A1 Support)` : 'You'} · {fmtDate(m.createdAt, true)}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={endRef} />
              </div>

              {active.status === 'Closed' ? (
                <Alert tone="info">This ticket is closed. Please open a new ticket if you still need help.</Alert>
              ) : (
                <form onSubmit={send} className="flex gap-2 border-t border-stone-200 pt-4">
                  <input value={reply} onChange={(e) => setReply(e.target.value)} maxLength={2000} className={inputCls} placeholder="Write a reply..." aria-label="Reply" />
                  <button type="submit" disabled={busy || reply.trim().length < 2} className={btnPrimary} aria-label="Send reply"><Send className="h-4 w-4" /></button>
                </form>
              )}
            </Card>
          ) : (
            <Card><p className="py-10 text-center text-sm text-stone-500">Select a ticket to read the conversation, or create a new one.</p></Card>
          )}
        </div>
      </div>
    </div>
  );
}
