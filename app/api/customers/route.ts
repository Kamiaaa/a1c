import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/db';
import { getStaff, publicCustomer } from '@/lib/session';
import { fail, readJson, serverError, str } from '@/lib/api';
import { generateTempPassword, randomCustomerId } from '@/lib/ids';
import { Customer, CUSTOMER_STATUSES, type CustomerStatus } from '@/models/Customer';
import Plan from '@/models/Plan';

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/customers?q=&status=   (admin + moderator)
export async function GET(req: Request) {
  try {
    const staff = await getStaff();
    if (!staff) return fail('Unauthorized', 403);

    const url = new URL(req.url);
    const q = str(url.searchParams.get('q'), 60);
    const status = url.searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (status && (CUSTOMER_STATUSES as readonly string[]).includes(status)) filter.status = status;
    if (q) {
      const rx = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ customerId: rx }, { name: rx }, { phone: rx }, { email: rx }];
    }

    await connectDB();
    const [customers, plans] = await Promise.all([
      Customer.find(filter).sort({ createdAt: -1 }).limit(500),
      Plan.find({}).select('id name price'),
    ]);
    const planMap = new Map(plans.map((p) => [p.id, p]));

    return NextResponse.json({
      data: customers.map((c) => ({
        ...publicCustomer(c),
        planName: c.planId ? planMap.get(c.planId)?.name ?? c.planId : null,
        planPrice: c.planId ? planMap.get(c.planId)?.price ?? null : null,
        createdBy: c.createdBy?.name ?? null,
      })),
    });
  } catch (e) {
    return serverError(e);
  }
}

// POST /api/customers  -> creates the account and returns the one-time temporary password
export async function POST(req: Request) {
  try {
    const staff = await getStaff();
    if (!staff) return fail('Unauthorized', 403);

    const body = await readJson<Record<string, unknown>>(req);
    const name = str(body.name, 100);
    const phone = str(body.phone, 20);
    const email = str(body.email, 120).toLowerCase();
    const address = str(body.address, 300);
    const planId = str(body.planId, 80);
    const status: CustomerStatus = (CUSTOMER_STATUSES as readonly string[]).includes(String(body.status))
      ? (body.status as CustomerStatus)
      : 'Active';

    if (name.length < 2) return fail('Customer name is required');
    if (!/^[+\d][\d\s-]{5,18}$/.test(phone)) return fail('A valid phone number is required');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('Invalid email address');

    await connectDB();
    if (planId && !(await Plan.exists({ id: planId }))) return fail('Selected package does not exist');

    let nextBillingDate: Date | null = null;
    if (body.nextBillingDate) {
      const d = new Date(String(body.nextBillingDate));
      if (Number.isNaN(d.getTime())) return fail('Invalid next billing date');
      nextBillingDate = d;
    }

    const temporaryPassword = generateTempPassword();
    const hash = await bcrypt.hash(temporaryPassword, 10);

    // A1C + 6 random digits; retry if the ID is already taken
    for (let attempt = 0; attempt < 8; attempt++) {
      try {
        const customer = await Customer.create({
          customerId: randomCustomerId(),
          name,
          phone,
          email: email || undefined,
          address,
          password: hash,
          mustChangePassword: true,
          planId: planId || null,
          status,
          nextBillingDate,
          createdBy: { id: staff.id, name: staff.name, role: staff.role },
        });
        return NextResponse.json(
          {
            customer: publicCustomer(customer),
            credentials: { customerId: customer.customerId, temporaryPassword },
          },
          { status: 201 }
        );
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) throw err;
      }
    }
    return fail('Could not generate a unique Customer ID, please try again', 500);
  } catch (e) {
    return serverError(e);
  }
}
