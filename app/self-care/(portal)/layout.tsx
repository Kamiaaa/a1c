'use client';

import { useState, type ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CircleUser, KeyRound, LayoutDashboard, LifeBuoy, LogOut, Menu, Receipt, Wifi, X } from 'lucide-react';
import { CustomerProvider, useCustomer } from '../_components/CustomerProvider';
import { Spinner, Badge, cx } from '../_components/ui';

const NAV = [
  { href: '/self-care', label: 'Overview', icon: LayoutDashboard },
  { href: '/self-care/package', label: 'My Package', icon: Wifi },
  { href: '/self-care/billing', label: 'Billing', icon: Receipt },
  { href: '/self-care/support', label: 'Support', icon: LifeBuoy },
  { href: '/self-care/profile', label: 'Profile', icon: CircleUser },
  { href: '/self-care/password', label: 'Password', icon: KeyRound },
];

function Shell({ children }: { children: ReactNode }) {
  const { me, loading } = useCustomer();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const locked = !!me?.customer.mustChangePassword; // only the password screen is allowed

  const logout = async () => {
    setSigningOut(true);
    try {
      await fetch('/api/self-care/logout', { method: 'POST' });
    } finally {
      router.replace('/self-care/login');
      router.refresh();
    }
  };

  const items = locked ? NAV.filter((n) => n.href === '/self-care/password') : NAV;

  return (
    <div className="min-h-screen bg-sand text-stone-900">
      <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <Link href={locked ? '/self-care/password' : '/self-care'} className="flex items-center gap-3">
            <Image src="/img/logo.png" alt="A1 Communication" width={120} height={40} className="h-9 w-auto" priority />
            <span className="hidden border-l border-stone-300 pl-3 text-sm font-semibold text-brand sm:inline">Self Care</span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Self Care">
            {items.map(({ href, label, icon: Icon }) => {
              const active = href === '/self-care' ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cx(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition',
                    active ? 'bg-brand text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-brand'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            {me && (
              <div className="hidden text-right leading-tight sm:block">
                <p className="text-sm font-semibold text-stone-800">{me.customer.name}</p>
                <p className="font-mono text-xs text-stone-500">{me.customer.customerId}</p>
              </div>
            )}
            <button
              onClick={logout}
              disabled={signingOut}
              className="hidden items-center gap-2 rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100 disabled:opacity-50 lg:flex"
            >
              <LogOut className="h-4 w-4" />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="rounded-lg p-2 text-stone-700 hover:bg-stone-100 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-stone-200 bg-white px-4 py-3 lg:hidden">
            {me && (
              <div className="mb-3 flex items-center justify-between rounded-xl bg-sand px-4 py-3">
                <div>
                  <p className="text-sm font-semibold">{me.customer.name}</p>
                  <p className="font-mono text-xs text-stone-500">{me.customer.customerId}</p>
                </div>
                <Badge value={me.customer.status} />
              </div>
            )}
            <nav className="grid gap-1">
              {items.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cx(
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium',
                    (href === '/self-care' ? pathname === href : pathname.startsWith(href)) ? 'bg-brand text-white' : 'text-stone-700 hover:bg-stone-100'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              ))}
              <button onClick={logout} className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-red-700 hover:bg-red-50">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </nav>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">{loading && !me ? <Spinner label="Loading your account..." /> : children}</main>

      <footer className="mx-auto max-w-6xl px-4 pb-10 text-center text-xs text-stone-500">
        Need help? Visit our <Link href="/contact" className="font-medium text-brand underline">contact page</Link> or open a ticket from the Support tab.
      </footer>
    </div>
  );
}

export default function PortalLayout({ children }: { children: ReactNode }) {
  return (
    <CustomerProvider>
      <Shell>{children}</Shell>
    </CustomerProvider>
  );
}
