import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { getJwtSecret } from '@/lib/secret';
import { CUSTOMER_COOKIE, STAFF_COOKIE } from '@/lib/constants';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const secret = getJwtSecret();

  /* ---------------- Customer Self Care portal (/self-care) ---------------- */
  if (pathname.startsWith('/self-care')) {
    // Login page is public. (The page itself redirects away if a valid session exists.)
    if (pathname === '/self-care/login') return NextResponse.next();

    const customerToken = req.cookies.get(CUSTOMER_COOKIE)?.value;
    if (!customerToken) return NextResponse.redirect(new URL('/self-care/login', req.url));

    try {
      const { payload } = await jwtVerify(customerToken, secret);
      // Temporary password still in use -> only the change-password screen is reachable
      if (payload.mcp === true && pathname !== '/self-care/password') {
        return NextResponse.redirect(new URL('/self-care/password', req.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/self-care/login', req.url));
    }
  }

  /* ---------------------------- Staff dashboard --------------------------- */
  const token = req.cookies.get(STAFF_COOKIE)?.value;
  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (isAuthPage) {
    if (token) {
      try {
        await jwtVerify(token, secret);
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } catch {
        // Token invalid, allow login/register
      }
    }
    return NextResponse.next();
  }

  if (isDashboardRoute) {
    if (!token) return NextResponse.redirect(new URL('/login', req.url));
    try {
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register', '/self-care/:path*'],
};
