// app/dashboard/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

type NavItem = { name: string; href: string; badge?: number };
type NavSection = { label?: string; items: NavItem[] };

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [user, setUser] = useState({ name: 'Loading...', role: 'user', email: '' });
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState({ pendingRequests: 0, openTickets: 0 });

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch {
        console.error('Failed to load session');
      }
    }
    fetchUser();
  }, []);

  // Sidebar badges (pending package requests / open tickets). Refreshed on every page change
  // so the numbers drop right after staff handle something.
  const canSeeOps = user.role === 'admin' || user.role === 'moderator';
  useEffect(() => {
    if (!canSeeOps) return;
    let cancelled = false;
    fetch('/api/dashboard/stats?counts=1')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancelled && d) setCounts({ pendingRequests: d.pendingRequests ?? 0, openTickets: d.openTickets ?? 0 });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [canSeeOps, pathname]);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        router.push('/login');
        router.refresh();
      }
    } catch (error) {
      console.error('Logout failed', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Menu grouped by area. Admin + Moderator run customer operations; Admin also manages the website and system.
  const getSections = (role: string): NavSection[] => {
    const sections: NavSection[] = [{ items: [{ name: 'Overview', href: '/dashboard' }] }];

    if (role === 'admin' || role === 'moderator') {
      sections.push({
        label: 'Customer Care',
        items: [
          { name: 'Customers', href: '/dashboard/customers' },
          { name: 'Package Requests', href: '/dashboard/package-requests', badge: counts.pendingRequests },
          { name: 'Billing', href: '/dashboard/invoices' },
          { name: 'Support Tickets', href: '/dashboard/tickets', badge: counts.openTickets },
        ],
      });
    }

    if (role === 'admin') {
      sections.push({
        label: 'Website',
        items: [
          { name: 'Carousel', href: '/dashboard/carousel' },
          { name: 'Manage Plans', href: '/dashboard/plans' },
          { name: 'Customer Orders', href: '/dashboard/orders' },
        ],
      });
      sections.push({ label: 'System', items: [{ name: 'User Management', href: '/dashboard/users' }] });
    }

    sections.push({
      label: 'Account',
      items: [
        { name: 'Profile', href: '/dashboard/profile' },
        { name: 'Settings', href: '/dashboard/settings' },
      ],
    });
    return sections;
  };

  const sections = getSections(user.role);
  const allItems = sections.flatMap((s) => s.items);

  const isItemActive = (href: string) => (href === '/dashboard' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`));
  const currentTitle = allItems.find((i) => isItemActive(i.href))?.name ?? 'Dashboard';

  const getInitials = (fullName: string) => {
    if (!fullName) return 'U';
    return fullName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const renderNav = (onNavigate?: () => void) => (
    <nav className="p-4 space-y-5" aria-label="Dashboard">
      {sections.map((section, si) => (
        <div key={section.label ?? si} className="space-y-1.5">
          {section.label && (
            <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">{section.label}</p>
          )}
          {section.items.map((item) => {
            const active = isItemActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-slate-800/80 text-slate-100 shadow-sm border border-slate-700/50'
                    : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200 hover:translate-x-1'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full transition-all duration-200 ${active ? 'bg-indigo-400' : 'bg-transparent group-hover:bg-slate-600'}`}></span>
                <span className="flex-1">{item.name}</span>
                {!!item.badge && item.badge > 0 && (
                  <span className="min-w-5 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-center text-[11px] font-semibold text-amber-400">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const totalAttention = counts.pendingRequests + counts.openTickets;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="w-64 border-r border-slate-800/80 bg-slate-900/40 backdrop-blur-xl flex-col justify-between hidden md:flex h-screen sticky top-0">
        <div className="overflow-y-auto">
          <div className="h-20 flex items-center px-6 border-b border-slate-800/80">
            <span className="font-bold text-lg tracking-tight text-slate-100 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
              App Dashboard
            </span>
          </div>
          {renderNav()}
        </div>

        <div className="p-4 border-t border-slate-800/80">
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {isLoggingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Modal/Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <aside className="relative w-64 border-r border-slate-800/80 bg-slate-900 flex flex-col justify-between z-10 h-full">
            <div className="overflow-y-auto">
              <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800/80">
                <span className="font-bold text-lg tracking-tight text-slate-100 flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  App Dashboard
                </span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-slate-100" aria-label="Close menu">
                  ✕
                </button>
              </div>
              {renderNav(() => setIsMobileMenuOpen(false))}
            </div>

            <div className="p-4 border-t border-slate-800/80">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-500/20"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 border-b border-slate-800/80 bg-slate-900/40 backdrop-blur-xl px-4 md:px-8 flex items-center justify-between relative z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-xl"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-base md:text-lg font-bold text-slate-100 tracking-tight">{currentTitle}</h1>
              <p className="text-xs text-slate-400 mt-0.5 truncate max-w-[180px] sm:max-w-none">Welcome back, {user.name} ({user.role})</p>
            </div>
          </div>

          <div className="flex items-center gap-5">
            {/* Bell: jumps to whatever needs attention first */}
            <Link
              href={counts.pendingRequests > 0 ? '/dashboard/package-requests' : '/dashboard/tickets'}
              aria-label={totalAttention ? `${totalAttention} items need attention` : 'Nothing needs attention'}
              className={`relative p-2.5 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 transition-all duration-200 group ${canSeeOps ? '' : 'pointer-events-none opacity-60'}`}
            >
              <svg className="w-5 h-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {totalAttention > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4 rounded-full bg-indigo-500 px-1 text-center text-[10px] font-bold leading-4 text-white">
                  {totalAttention > 99 ? '99+' : totalAttention}
                </span>
              )}
            </Link>

            <div className="h-8 w-[1px] bg-slate-800 hidden sm:block"></div>

            {/* Hover Profile Menu with proper z-index */}
            <div className="relative py-2" onMouseEnter={() => setIsProfileMenuOpen(true)} onMouseLeave={() => setIsProfileMenuOpen(false)}>
              <div className="flex items-center gap-3.5 px-3 py-1.5 rounded-2xl bg-slate-800/20 hover:bg-slate-800/60 transition-all duration-200 cursor-pointer border border-slate-800/60">
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-indigo-500/20">
                  {getInitials(user.name)}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-semibold text-slate-200 leading-tight">{user.name}</p>
                  <p className="text-xs text-indigo-400 font-medium mt-0.5 capitalize">{user.role}</p>
                </div>
              </div>

              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full w-56 rounded-2xl border border-slate-800 bg-slate-900/95 py-2 shadow-2xl backdrop-blur-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2 border-b border-slate-800/80 sm:hidden">
                    <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                    <p className="text-xs text-indigo-400 capitalize">{user.role}</p>
                  </div>

                  <div className="py-1">
                    <Link href="/dashboard/profile" className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition">
                      Your Profile
                    </Link>
                    <Link href="/dashboard/settings" className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition">
                      Settings
                    </Link>
                    <Link href="/dashboard/settings#password" className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800/60 hover:text-slate-100 transition">
                      Change Password
                    </Link>
                  </div>

                  <div className="border-t border-slate-800/80 pt-1 mt-1">
                    <button
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full text-left px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                    >
                      {isLoggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
