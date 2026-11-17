import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/session';
import { serverError } from '@/lib/api';
import { Invoice } from '@/models/Invoice';

export async function GET() {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;
    const invoices = await Invoice.find({ customer: auth.customer._id }).sort({ createdAt: -1 }).limit(60);
    return NextResponse.json({ data: invoices });
  } catch (e) {
    return serverError(e);
  }
}
