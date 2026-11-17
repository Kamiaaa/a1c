import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/session';
import { fail, isObjectId, serverError } from '@/lib/api';
import { PackageRequest } from '@/models/PackageRequest';

// DELETE = the customer cancels their own pending request
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;

    const { id } = await params;
    if (!isObjectId(id)) return fail('Request not found', 404);

    const request = await PackageRequest.findOneAndUpdate(
      { _id: id, customer: auth.customer._id, status: 'Pending' },
      { status: 'Cancelled', processedAt: new Date() },
      { new: true }
    );
    if (!request) return fail('Pending request not found', 404);
    return NextResponse.json({ data: request });
  } catch (e) {
    return serverError(e);
  }
}
