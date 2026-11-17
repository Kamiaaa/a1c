import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getStaff, publicCustomer } from '@/lib/session';
import { fail, isObjectId, readJson, serverError, str } from '@/lib/api';
import { Customer, CUSTOMER_STATUSES } from '@/models/Customer';
import { PackageRequest } from '@/models/PackageRequest';
import { Invoice } from '@/models/Invoice';
import { Ticket } from '@/models/Ticket';
import Plan from '@/models/Plan';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Customer not found', 404);
    await connectDB();
    const customer = await Customer.findById(id);
    if (!customer) return fail('Customer not found', 404);
    return NextResponse.json({ customer: publicCustomer(customer) });
  } catch (e) {
    return serverError(e);
  }
}

// PUT: edit details, change package, change connection status (admin + moderator)
export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Customer not found', 404);

    const body = await readJson<Record<string, unknown>>(req);
    await connectDB();
    const customer = await Customer.findById(id);
    if (!customer) return fail('Customer not found', 404);

    if (body.name !== undefined) {
      const name = str(body.name, 100);
      if (name.length < 2) return fail('Customer name is required');
      customer.name = name;
    }
    if (body.phone !== undefined) {
      const phone = str(body.phone, 20);
      if (!/^[+\d][\d\s-]{5,18}$/.test(phone)) return fail('A valid phone number is required');
      customer.phone = phone;
    }
    if (body.email !== undefined) {
      const email = str(body.email, 120).toLowerCase();
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Invalid email address');
      customer.email = email || undefined;
    }
    if (body.address !== undefined) customer.address = str(body.address, 300);

    if (body.status !== undefined) {
      if (!(CUSTOMER_STATUSES as readonly string[]).includes(String(body.status))) return fail('Invalid status');
      customer.status = body.status as (typeof CUSTOMER_STATUSES)[number];
    }
    if (body.planId !== undefined) {
      const planId = str(body.planId, 80);
      if (planId && !(await Plan.exists({ id: planId }))) return fail('Selected package does not exist');
      customer.planId = planId || null;
    }
    if (body.nextBillingDate !== undefined) {
      if (!body.nextBillingDate) customer.nextBillingDate = null;
      else {
        const d = new Date(String(body.nextBillingDate));
        if (Number.isNaN(d.getTime())) return fail('Invalid next billing date');
        customer.nextBillingDate = d;
      }
    }

    await customer.save();
    return NextResponse.json({ customer: publicCustomer(customer) });
  } catch (e) {
    return serverError(e);
  }
}

// DELETE: admin only. Removes the customer and everything tied to them.
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff(['admin']))) return fail('Only administrators can delete customers', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Customer not found', 404);
    await connectDB();
    const deleted = await Customer.findByIdAndDelete(id);
    if (!deleted) return fail('Customer not found', 404);
    await Promise.all([
      PackageRequest.deleteMany({ customer: id }),
      Invoice.deleteMany({ customer: id }),
      Ticket.deleteMany({ customer: id }),
    ]);
    return NextResponse.json({ message: 'Customer deleted' });
  } catch (e) {
    return serverError(e);
  }
}
