'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Wifi, Receipt, LifeBuoy } from 'lucide-react';
import { http, errMsg } from '@/lib/http';
import { Alert, btnAccent, inputCls, labelCls } from '../_components/ui';

export default function SelfCareLoginPage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Already signed in? Skip the form.
  useEffect(() => {
    http<{ customer: { mustChangePassword: boolean } }>('/api/self-care/me', { silent: true })
      .then((r) => router.replace(r.customer.mustChangePassword ? '/self-care/password' : '/self-care'))
      .catch(() => {});
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await http<{ mustChangePassword: boolean }>('/api/self-care/login', {
        method: 'POST',
        json: { customerId, password },
      });
      router.replace(res.mustChangePassword ? '/self-care/password' : '/self-care');
      router.refresh();
    } catch (err) {
      setError(errMsg(err));
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-sand lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand p-12 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/20 blur-3xl" aria-hidden />
        <Link href="/" className="relative inline-flex w-fit rounded-xl bg-white px-4 py-2">
          <Image src="/img/logo.png" alt="A1 Communication" width={140} height={44} className="h-10 w-auto" priority />
        </Link>
        <div className="relative max-w-md">
          <h1 className="text-4xl font-bold leading-tight">Manage your internet connection, your way.</h1>
          <p className="mt-4 text-white/75">Check your package, pay and track bills, and reach our support team without a phone call.</p>
          <ul className="mt-8 space-y-4 text-sm">
            {[
              [Wifi, 'See your current package and change it any time'],
              [Receipt, 'View invoices and your billing status'],
              [LifeBuoy, 'Open support tickets and follow the replies'],
            ].map(([Icon, text], i) => {
              const I = Icon as typeof Wifi;
              return (
                <li key={i} className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                    <I className="h-4 w-4 text-accent" />
                  </span>
                  {text as string}
                </li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-xs text-white/50">A1 Communication</p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 inline-flex rounded-xl bg-white px-3 py-2 shadow-sm lg:hidden">
            <Image src="/img/logo.png" alt="A1 Communication" width={120} height={38} className="h-9 w-auto" />
          </Link>

          <h2 className="text-2xl font-bold tracking-tight text-brand">Self Care Login</h2>
          <p className="mt-1 text-sm text-stone-600">Sign in with the Customer ID and password we gave you.</p>

          <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
            {error && <Alert tone="error">{error}</Alert>}

            <div>
              <label htmlFor="cid" className={labelCls}>Customer ID</label>
              <input
                id="cid"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value.toUpperCase())}
                className={`${inputCls} font-mono tracking-wider`}
                placeholder="A1C123456"
                autoComplete="username"
                autoCapitalize="characters"
                spellCheck={false}
                required
              />
            </div>

            <div>
              <label htmlFor="pw" className={labelCls}>Password</label>
              <div className="relative">
                <input
                  id="pw"
                  type={show ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputCls} pr-12`}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute inset-y-0 right-0 px-4 text-stone-500 hover:text-brand"
                  aria-label={show ? 'Hide password' : 'Show password'}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className={`${btnAccent} w-full py-3`}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <div className="mt-6 space-y-2 text-center text-xs text-stone-500">
            <p>First time here? Use the temporary password you received. You will be asked to choose your own.</p>
            <p>
              Forgot your password or don&apos;t have an ID?{' '}
              <Link href="/contact" className="font-semibold text-brand underline">Contact support</Link>
            </p>
            <p><Link href="/" className="hover:underline">&larr; Back to website</Link></p>
          </div>
        </div>
      </main>
    </div>
  );
}
