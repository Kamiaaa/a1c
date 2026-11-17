import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { requireCustomer, setCustomerCookie, signCustomerToken } from '@/lib/session';
import { fail, readJson, serverError } from '@/lib/api';
import { validatePassword } from '@/lib/ids';

export async function POST(req: Request) {
  try {
    const auth = await requireCustomer({ allowMustChange: true, withPassword: true });
    if (!auth.ok) return auth.response;
    const { customer } = auth;

    const { currentPassword, newPassword } = await readJson<{ currentPassword?: string; newPassword?: string }>(req);
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || !currentPassword || !newPassword) {
      return fail('Please provide your current and new password');
    }

    const problem = validatePassword(newPassword);
    if (problem) return fail(problem);

    if (!(await bcrypt.compare(currentPassword, customer.password))) {
      return fail('Current password is incorrect');
    }
    if (currentPassword === newPassword) return fail('New password must be different from the current one');

    customer.password = await bcrypt.hash(newPassword, 10);
    customer.mustChangePassword = false;
    customer.tokenVersion += 1; // signs out every other device
    await customer.save();

    const res = NextResponse.json({ message: 'Password updated successfully' });
    setCustomerCookie(res, await signCustomerToken(customer));
    return res;
  } catch (e) {
    return serverError(e);
  }
}
