import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, serverError } from '@/lib/api';
import { Customer } from '@/models/Customer';
import { PackageRequest } from '@/models/PackageRequest';
import { Ticket } from '@/models/Ticket';
import { Invoice } from '@/models/Invoice';
import { Slide } from '@/models/Slide';
import Order from '@/models/Order';
import Plan from '@/models/Plan';

// GET /api/dashboard/stats          -> full overview numbers
// GET /api/dashboard/stats?counts=1 -> only the two sidebar badges (cheap)
export async function GET(req: Request) {
  try {
    const staff = await getStaff(['admin', 'moderator', 'user']);
    if (!staff) return fail('Unauthorized', 401);

    // Plain "user" accounts have no operational data
    if (staff.role === 'user') return NextResponse.json({ role: staff.role });

    await connectDB();
    const countsOnly = new URL(req.url).searchParams.get('counts') === '1';

    const [pendingRequests, openTickets] = await Promise.all([
      PackageRequest.countDocuments({ status: 'Pending' }),
      Ticket.countDocuments({ status: { $in: ['Open', 'In Progress'] } }),
    ]);
    if (countsOnly) return NextResponse.json({ role: staff.role, pendingRequests, openTickets });

    const [byStatus, unpaid, recentCustomers, recentRequests, plans] = await Promise.all([
      Customer.aggregate<{ _id: string; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
      Invoice.aggregate<{ _id: null; total: number; count: number }>([
        { $match: { status: 'Unpaid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Customer.find().sort({ createdAt: -1 }).limit(5).select('customerId name status planId createdAt'),
      PackageRequest.find({ status: 'Pending' }).sort({ createdAt: -1 }).limit(5),
      Plan.find({}).select('id name'),
    ]);

    const planName = new Map(plans.map((p) => [p.id, p.name]));
    const n = (s: string) => byStatus.find((x) => x._id === s)?.n ?? 0;

    const data: Record<string, unknown> = {
      role: staff.role,
      customers: {
        total: n('Active') + n('Suspended') + n('Disconnected'),
        active: n('Active'),
        suspended: n('Suspended'),
        disconnected: n('Disconnected'),
      },
      pendingRequests,
      openTickets,
      unpaid: { count: unpaid[0]?.count ?? 0, total: unpaid[0]?.total ?? 0 },
      recentCustomers: recentCustomers.map((c) => ({
        id: c._id.toString(),
        customerId: c.customerId,
        name: c.name,
        status: c.status,
        planName: c.planId ? planName.get(c.planId) ?? c.planId : null,
        createdAt: c.createdAt,
      })),
      recentRequests: recentRequests.map((r) => ({
        id: r._id.toString(),
        customerName: r.customerName,
        customerId: r.customerId,
        fromPlanName: r.fromPlanName ?? null,
        toPlanName: r.toPlanName,
        createdAt: r.createdAt,
      })),
    };

    // Website management numbers are admin-only (matches the admin-only menu items)
    if (staff.role === 'admin') {
      const [pendingOrders, totalOrders, activeSlides, totalSlides] = await Promise.all([
        Order.countDocuments({ status: 'Pending' }),
        Order.countDocuments({}),
        Slide.countDocuments({ isActive: true }),
        Slide.countDocuments({}),
      ]);
      data.admin = { pendingOrders, totalOrders, plans: plans.length, slides: { active: activeSlides, total: totalSlides } };
    }

    return NextResponse.json(data);
  } catch (e) {
    return serverError(e);
  }
}
