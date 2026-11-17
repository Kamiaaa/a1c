/* Tiny fetch wrapper used by the dashboard and the Self Care portal (client side). */

export class HttpError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// silent: never auto-redirect on 401 / password-change-required (used by the login page's "already signed in?" probe)
type Options = Omit<RequestInit, 'body'> & { json?: unknown; silent?: boolean };

export async function http<T = unknown>(url: string, options: Options = {}): Promise<T> {
  const { json, headers, silent, ...rest } = options;
  const res = await fetch(url, {
    ...rest,
    headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  });

  let data: { error?: string; code?: string } | null = null;
  try {
    data = await res.json();
  } catch {
    /* empty body */
  }

  if (!res.ok) {
    // Portal pages: expired session -> login, temporary password still active -> change password
    if (
      !silent &&
      typeof window !== 'undefined' &&
      url.startsWith('/api/self-care') &&
      !url.startsWith('/api/self-care/login') &&
      !window.location.pathname.startsWith('/self-care/login') // never redirect to the page we are already on
    ) {
      if (res.status === 401) window.location.assign('/self-care/login');
      else if (data?.code === 'PASSWORD_CHANGE_REQUIRED') window.location.assign('/self-care/password');
    }
    throw new HttpError(data?.error || `Request failed (${res.status})`, res.status, data?.code);
  }
  return data as T;
}

export const errMsg = (e: unknown) => (e instanceof Error ? e.message : 'Something went wrong');
