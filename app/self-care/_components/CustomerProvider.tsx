'use client';

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { http } from '@/lib/http';
import type { MeResponse } from '@/lib/types';

interface Ctx {
  me: MeResponse | null;
  loading: boolean;
  reload: () => Promise<void>;
}

const CustomerContext = createContext<Ctx>({ me: null, loading: true, reload: async () => {} });

export const useCustomer = () => useContext(CustomerContext);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const reload = useCallback(async () => {
    try {
      setMe(await http<MeResponse>('/api/self-care/me'));
    } catch {
      /* http() already redirects to the login page on 401 */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  // Temporary password must be replaced before anything else is usable
  useEffect(() => {
    if (me?.customer.mustChangePassword && pathname !== '/self-care/password') {
      router.replace('/self-care/password');
    }
  }, [me, pathname, router]);

  return <CustomerContext.Provider value={{ me, loading, reload }}>{children}</CustomerContext.Provider>;
}
