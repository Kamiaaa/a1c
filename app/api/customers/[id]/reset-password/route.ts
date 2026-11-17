import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, isObjectId, serverError } from '@/lib/api';
import { generateTempPassword } from '@/lib/ids';
import { Customer } from '@/models/Customer';

// Issues a NEW temporary password (e.g. customer forgot theirs). Old sessions are signed out.
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Customer not found', 404);

    await connectDB();
    const customer = await Customer.findById(id);
    if (!customer) return fail('Customer not found', 404);

    const temporaryPassword = generateTempPassword();
    customer.password = await bcrypt.hash(temporaryPassword, 10);
    customer.mustChangePassword = true;
    customer.tokenVersion += 1;
    await customer.save();

    return NextResponse.json({ credentials: { customerId: customer.customerId, temporaryPassword } });
  } catch (e) {
    return serverError(e);
  }
}
