import { NextResponse } from 'next/server';
import { requireCustomer, publicCustomer } from '@/lib/session';
import { serverError } from '@/lib/api';
import Plan from '@/models/Plan';
import { Invoice } from '@/models/Invoice';
import { Ticket } from '@/models/Ticket';
import { PackageRequest } from '@/models/PackageRequest';

export async function GET() {
  try {
    // allowMustChange: the portal needs /me to know it must send the customer to the password screen
    const auth = await requireCustomer({ allowMustChange: true });
    if (!auth.ok) return auth.response;
    const { customer } = auth;

    const [plan, unpaid, openTickets, pending] = await Promise.all([
      customer.planId ? Plan.findOne({ id: customer.planId }) : null,
      Invoice.aggregate<{ _id: null; total: number; count: number }>([
        { $match: { customer: customer._id, status: 'Unpaid' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]),
      Ticket.countDocuments({ customer: customer._id, status: { $in: ['Open', 'In Progress'] } }),
      PackageRequest.findOne({ customer: customer._id, status: 'Pending' }).sort({ createdAt: -1 }),
    ]);

    return NextResponse.json({
      customer: publicCustomer(customer),
      plan: plan
        ? { id: plan.id, name: plan.name, price: plan.price, image: plan.image, features: plan.features }
        : null,
      summary: {
        unpaidTotal: unpaid[0]?.total ?? 0,
        unpaidCount: unpaid[0]?.count ?? 0,
        openTickets,
        pendingRequest: pending
          ? { id: pending._id.toString(), toPlanName: pending.toPlanName, createdAt: pending.createdAt }
          : null,
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
