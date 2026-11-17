'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { http, errMsg } from '@/lib/http';
import { useCustomer } from '../../_components/CustomerProvider';
import { Alert, Card, PageHeader, btnAccent, cx, inputCls, labelCls } from '../../_components/ui';

export default function PasswordPage() {
  const { me, reload } = useCustomer();
  const router = useRouter();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  if (!me) return null;
  const forced = me.customer.mustChangePassword;

  const checks = [
    { ok: next.length >= 8, label: 'At least 8 characters' },
    { ok: /[A-Za-z]/.test(next), label: 'A letter' },
    { ok: /\d/.test(next), label: 'A number' },
    { ok: next.length > 0 && next === confirm, label: 'Both passwords match' },
  ];
  const valid = checks.every((c) => c.ok) && current.length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!valid) return;
    setBusy(true);
    setMsg(null);
    try {
      await http('/api/self-care/change-password', { method: 'POST', json: { currentPassword: current, newPassword: next } });
      setCurrent(''); setNext(''); setConfirm('');
      await reload();
      if (forced) {
        router.replace('/self-care');
      } else {
        setMsg({ tone: 'success', text: 'Password updated. Other devices have been signed out.' });
      }
    } catch (err) {
      setMsg({ tone: 'error', text: errMsg(err) });
    } finally {
      setBusy(false);
    }
  };

  const type = show ? 'text' : 'password';

  return (
    <div className="max-w-xl space-y-6">
      <PageHeader title={forced ? 'Set your new password' : 'Change password'} subtitle="Keep your account secure with a password only you know." />

      {forced && (
        <Alert tone="warning">
          You signed in with a <strong>temporary password</strong>. Please choose a new one to continue. Enter the temporary password below as your current password.
        </Alert>
      )}

      <Card>
        <form onSubmit={submit} className="space-y-4">
          {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}

          <div>
            <label htmlFor="cur" className={labelCls}>{forced ? 'Temporary password' : 'Current password'}</label>
            <input id="cur" type={type} value={current} onChange={(e) => setCurrent(e.target.value)} className={inputCls} autoComplete="current-password" required />
          </div>
          <div>
            <label htmlFor="new" className={labelCls}>New password</label>
            <input id="new" type={type} value={next} onChange={(e) => setNext(e.target.value)} className={inputCls} autoComplete="new-password" required />
          </div>
          <div>
            <label htmlFor="conf" className={labelCls}>Confirm new password</label>
            <input id="conf" type={type} value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} autoComplete="new-password" required />
          </div>

          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {checks.map((c) => (
              <li key={c.label} className={cx('flex items-center gap-2', c.ok ? 'text-emerald-700' : 'text-stone-500')}>
                <span aria-hidden>{c.ok ? '✓' : '○'}</span>{c.label}
              </li>
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="button" onClick={() => setShow((s) => !s)} className="flex items-center gap-2 text-sm font-medium text-stone-600 hover:text-brand">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{show ? 'Hide' : 'Show'} passwords
            </button>
            <button type="submit" disabled={busy || !valid} className={btnAccent}>{busy ? 'Updating...' : 'Update password'}</button>
          </div>
        </form>
      </Card>
    </div>
  );
}
