import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, isObjectId, readJson, serverError, str } from '@/lib/api';
import { Invoice } from '@/models/Invoice';

type Ctx = { params: Promise<{ id: string }> };

// PUT { status: 'Paid' | 'Unpaid', paymentMethod? }
export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Invoice not found', 404);

    const body = await readJson<{ status?: string; paymentMethod?: string }>(req);
    if (body.status !== 'Paid' && body.status !== 'Unpaid') return fail('Invalid status');

    await connectDB();
    const invoice = await Invoice.findById(id);
    if (!invoice) return fail('Invoice not found', 404);

    invoice.status = body.status;
    invoice.paidAt = body.status === 'Paid' ? new Date() : null;
    invoice.paymentMethod = body.status === 'Paid' ? str(body.paymentMethod, 40) || 'Cash' : undefined;
    await invoice.save();
    return NextResponse.json({ data: invoice });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff(['admin']))) return fail('Only administrators can delete invoices', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Invoice not found', 404);
    await connectDB();
    const deleted = await Invoice.findByIdAndDelete(id);
    if (!deleted) return fail('Invoice not found', 404);
    return NextResponse.json({ message: 'Invoice deleted' });
  } catch (e) {
    return serverError(e);
  }
}
