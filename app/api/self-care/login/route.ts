import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { Customer } from '@/models/Customer';
import { setCustomerCookie, signCustomerToken } from '@/lib/session';
import { clearFailures, isBlocked, recordFailure } from '@/lib/rateLimit';
import { clientIp, fail, readJson, serverError, str } from '@/lib/api';

// Used to keep response time similar when the customer ID does not exist.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password-1', 10);

export async function POST(req: Request) {
  try {
    const body = await readJson<{ customerId?: string; password?: string }>(req);
    const cid = str(body.customerId, 30).toUpperCase();
    const password = typeof body.password === 'string' ? body.password : '';

    if (!cid || !password) return fail('Please enter your Customer ID and password');

    const key = `${clientIp(req)}:${cid}`;
    const wait = isBlocked(key);
    if (wait) return fail(`Too many failed attempts. Try again in ${Math.ceil(wait / 60)} minute(s).`, 429);

    await connectDB();
    const customer = await Customer.findOne({ customerId: cid }).select('+password');
    const ok = await bcrypt.compare(password, customer?.password ?? DUMMY_HASH);

    if (!customer || !ok) {
      recordFailure(key);
      return fail('Invalid Customer ID or password', 401);
    }

    clearFailures(key);
    await Customer.updateOne({ _id: customer._id }, { lastLoginAt: new Date() });

    const res = NextResponse.json({
      message: 'Signed in',
      mustChangePassword: customer.mustChangePassword,
    });
    setCustomerCookie(res, await signCustomerToken(customer));
    return res;
  } catch (e) {
    return serverError(e);
  }
}
