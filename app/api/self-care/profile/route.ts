import { NextResponse } from 'next/server';
import { publicCustomer, requireCustomer } from '@/lib/session';
import { fail, readJson, serverError, str } from '@/lib/api';

// Customers may only edit their own contact details. Name, plan and status are staff-managed.
export async function PUT(req: Request) {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;
    const { customer } = auth;

    const body = await readJson<{ phone?: string; email?: string; address?: string }>(req);
    const phone = str(body.phone, 20);
    const email = str(body.email, 120).toLowerCase();
    const address = str(body.address, 300);

    if (!/^[+\d][\d\s-]{5,18}$/.test(phone)) return fail('Please enter a valid phone number');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Please enter a valid email address');

    customer.phone = phone;
    customer.email = email || undefined;
    customer.address = address;
    await customer.save();

    return NextResponse.json({ customer: publicCustomer(customer) });
  } catch (e) {
    return serverError(e);
  }
}
