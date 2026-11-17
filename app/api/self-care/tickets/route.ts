import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/session';
import { fail, readJson, serverError, str } from '@/lib/api';
import { randomTicketNo } from '@/lib/ids';
import { Ticket, TICKET_CATEGORIES } from '@/models/Ticket';

type Category = (typeof TICKET_CATEGORIES)[number];

export async function GET() {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;
    const data = await Ticket.find({ customer: auth.customer._id })
      .select('-messages')
      .sort({ updatedAt: -1 })
      .limit(50);
    return NextResponse.json({ data });
  } catch (e) {
    return serverError(e);
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;
    const { customer } = auth;

    const body = await readJson<{ subject?: string; category?: string; message?: string }>(req);
    const subject = str(body.subject, 120);
    const message = str(body.message, 2000);
    const category: Category = (TICKET_CATEGORIES as readonly string[]).includes(body.category ?? '') ? (body.category as Category) : 'Other';

    if (subject.length < 3) return fail('Please enter a subject');
    if (message.length < 5) return fail('Please describe your issue');

    const open = await Ticket.countDocuments({ customer: customer._id, status: { $in: ['Open', 'In Progress'] } });
    if (open >= 5) return fail('You already have 5 open tickets. Please wait for them to be resolved.');

    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const ticket = await Ticket.create({
          ticketNo: randomTicketNo(),
          customer: customer._id,
          customerId: customer.customerId,
          customerName: customer.name,
          subject,
          category,
          messages: [{ sender: 'customer', name: customer.name, text: message }],
        });
        return NextResponse.json({ data: ticket }, { status: 201 });
      } catch (err) {
        if ((err as { code?: number }).code !== 11000) throw err; // retry only on duplicate ticket number
      }
    }
    return fail('Could not create ticket, please try again', 500);
  } catch (e) {
    return serverError(e);
  }
}
