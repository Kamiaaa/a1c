import { NextResponse } from 'next/server';
import { clearCustomerCookie } from '@/lib/session';

export async function POST() {
  const res = NextResponse.json({ message: 'Signed out' });
  clearCustomerCookie(res);
  return res;
}
