import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, isObjectId, readJson, serverError, str } from '@/lib/api';
import { randomInvoiceNo } from '@/lib/ids';
import { pageMeta, parsePaging } from '@/lib/pagination';
import { Invoice } from '@/models/Invoice';
import { Customer } from '@/models/Customer';
import Plan from '@/models/Plan';

// GET /api/invoices?status=Paid|Unpaid&customer=<id>&page=1&limit=10  ->  { data, pagination }
export async function GET(req: Request) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const sp = new URL(req.url).searchParams;
    const filter: Record<string, unknown> = {};
    const status = sp.get('status');
    if (status === 'Paid' || status === 'Unpaid') filter.status = status;
    const customer = sp.get('customer');
    if (customer && isObjectId(customer)) filter.customer = customer;

    const { page: requestedPage, limit } = parsePaging(req.url, { defaultLimit: 10, maxLimit: 100 });

    await connectDB();
    const total = await Invoice.countDocuments(filter);
    const meta = pageMeta(total, requestedPage, limit);
    const data = await Invoice.find(filter).sort({ createdAt: -1, _id: -1 }).skip(meta.skip).limit(limit);

    return NextResponse.json({
      data,
      pagination: { page: meta.page, limit: meta.limit, total: meta.total, totalPages: meta.totalPages },
    });
  } catch (e) {
    return serverError(e);
  }
}

// POST { customer: <customer _id>, period, amount, dueDate }
export async function POST(req: Request) {
  try {
    const staff = await getStaff();
    if (!staff) return fail('Unauthorized', 403);

    const body = await readJson<Record<string, unknown>>(req);
    const period = str(body.period, 60);
    const amount = Number(body.amount);
    const dueDate = new Date(String(body.dueDate));

    if (!isObjectId(body.customer)) return fail('Please choose a customer');
    if (!period) return fail('Billing period is required (e.g. November 2026)');
    if (!Number.isFinite(amount) || amount < 0) return fail('Enter a valid amount');
    if (Number.isNaN(dueDate.getTime())) return fail('Enter a valid due date');

    await connectDB();
    const customer = await Customer.findById(body.customer);
    if (!customer) return fail('Customer not found', 404);
    const plan = customer.planId ? await Plan.findOne({ id: customer.planId }) : null;

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const invoice = await Invoice.create({
          invoiceNo: randomInvoiceNo(),
          customer: customer._id,
          customerId: customer.customerId,
          customerName: customer.name,
          period,
          planName: plan?.name,
          amount,
          dueDate,
          createdBy: staff.name,
        });
        return NextResponse.json({ data: invoice }, { status: 201 });
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) throw err;
      }
    }
    return fail('Could not create invoice, please try again', 500);
  } catch (e) {
    return serverError(e);
  }
}
