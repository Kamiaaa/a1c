import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/session';
import { fail, isObjectId, readJson, serverError, str } from '@/lib/api';
import { Ticket } from '@/models/Ticket';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return fail('Ticket not found', 404);

    const ticket = await Ticket.findOne({ _id: id, customer: auth.customer._id });
    if (!ticket) return fail('Ticket not found', 404);
    return NextResponse.json({ data: ticket });
  } catch (e) {
    return serverError(e);
  }
}

// POST = customer adds a reply
export async function POST(req: Request, { params }: Ctx) {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;
    const { id } = await params;
    if (!isObjectId(id)) return fail('Ticket not found', 404);

    const text = str((await readJson<{ text?: string }>(req)).text, 2000);
    if (text.length < 2) return fail('Please type a message');

    const ticket = await Ticket.findOne({ _id: id, customer: auth.customer._id });
    if (!ticket) return fail('Ticket not found', 404);
    if (ticket.status === 'Closed') return fail('This ticket is closed. Please open a new one.');

    ticket.messages.push({ sender: 'customer', name: auth.customer.name, text, createdAt: new Date() });
    if (ticket.status === 'Resolved') ticket.status = 'Open'; // customer replied, so reopen
    await ticket.save();
    return NextResponse.json({ data: ticket });
  } catch (e) {
    return serverError(e);
  }
}
