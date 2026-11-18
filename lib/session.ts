import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { jwtVerify, SignJWT } from 'jose';
import connectDB from '@/lib/db';
import { Customer, ICustomer } from '@/models/Customer';
import { getJwtSecret } from '@/lib/secret';
import { CUSTOMER_COOKIE, STAFF_COOKIE } from '@/lib/constants';

/* ------------------------------ staff ------------------------------ */

export type StaffRole = 'admin' | 'moderator' | 'user';
export interface StaffSession {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
}

/** Returns the signed-in staff member if their role is allowed, otherwise null. */
export async function getStaff(allowed: StaffRole[] = ['admin', 'moderator']): Promise<StaffSession | null> {
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    const role = payload.role as StaffRole;
    if (!allowed.includes(role)) return null;
    return {
      id: String(payload.id),
      name: String(payload.name),
      email: String(payload.email),
      role,
    };
  } catch {
    return null;
  }
}

/* ----------------------------- customer ---------------------------- */

const CUSTOMER_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 3; // 3 days

// "Secure" cookies are dropped by browsers on plain http://. If you must serve the portal over http
// (e.g. a bare IP address), set COOKIE_SECURE=false - otherwise login looks successful but never sticks.
const cookieSecure = process.env.COOKIE_SECURE ? process.env.COOKIE_SECURE === 'true' : process.env.NODE_ENV === 'production';

export async function signCustomerToken(c: ICustomer): Promise<string> {
  return new SignJWT({ cid: c.customerId, tv: c.tokenVersion, mcp: c.mustChangePassword })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(c._id.toString())
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_TOKEN_TTL_SECONDS}s`)
    .sign(getJwtSecret());
}

export function setCustomerCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: CUSTOMER_COOKIE,
    value: token,
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax', // 'strict' would drop the cookie on links opened from WhatsApp/SMS/email
    maxAge: CUSTOMER_TOKEN_TTL_SECONDS,
    path: '/',
  });
}

export function clearCustomerCookie(res: NextResponse) {
  res.cookies.set({
    name: CUSTOMER_COOKIE,
    value: '',
    httpOnly: true,
    secure: cookieSecure,
    sameSite: 'lax', // 'strict' would drop the cookie on links opened from WhatsApp/SMS/email
    maxAge: 0,
    path: '/',
  });
}

type CustomerAuth = { ok: true; customer: ICustomer } | { ok: false; response: NextResponse };

function deny(message: string, status: number, clear = false, extra: Record<string, unknown> = {}): CustomerAuth {
  const response = NextResponse.json({ error: message, ...extra }, { status });
  if (clear) clearCustomerCookie(response);
  return { ok: false, response };
}

/**
 * Loads the signed-in customer from the cookie + database.
 * - rejects invalid/expired tokens
 * - rejects tokens issued before a password reset / change (tokenVersion)
 * - blocks everything except the change-password flow while a temporary password is still in use
 */
export async function requireCustomer(
  opts: { allowMustChange?: boolean; withPassword?: boolean } = {}
): Promise<CustomerAuth> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!token) return deny('Please sign in to continue', 401);

  let sub: string | undefined;
  let tv: unknown;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    sub = payload.sub;
    tv = payload.tv;
  } catch {
    return deny('Your session has expired. Please sign in again.', 401, true);
  }
  if (!sub) return deny('Invalid session', 401, true);

  await connectDB();
  const query = Customer.findById(sub);
  const customer = await (opts.withPassword ? query.select('+password') : query);
  if (!customer || customer.tokenVersion !== tv) {
    return deny('Your session has expired. Please sign in again.', 401, true);
  }
  if (customer.mustChangePassword && !opts.allowMustChange) {
    return deny('Please change your temporary password first', 403, false, { code: 'PASSWORD_CHANGE_REQUIRED' });
  }
  return { ok: true, customer };
}

/* ---------------------------- serializers -------------------------- */

export function publicCustomer(c: ICustomer) {
  return {
    id: c._id.toString(),
    customerId: c.customerId,
    name: c.name,
    phone: c.phone,
    email: c.email ?? '',
    address: c.address ?? '',
    planId: c.planId ?? null,
    status: c.status,
    mustChangePassword: c.mustChangePassword,
    connectionDate: c.connectionDate,
    nextBillingDate: c.nextBillingDate ?? null,
    lastLoginAt: c.lastLoginAt ?? null,
    createdAt: c.createdAt,
  };
}
