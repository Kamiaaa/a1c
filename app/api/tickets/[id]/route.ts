import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, isObjectId, readJson, serverError, str } from '@/lib/api';
import { Ticket, TICKET_STATUSES } from '@/models/Ticket';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Ticket not found', 404);
    await connectDB();
    const ticket = await Ticket.findById(id);
    if (!ticket) return fail('Ticket not found', 404);
    return NextResponse.json({ data: ticket });
  } catch (e) {
    return serverError(e);
  }
}

// POST = staff reply
export async function POST(req: Request, { params }: Ctx) {
  try {
    const staff = await getStaff();
    if (!staff) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Ticket not found', 404);

    const text = str((await readJson<{ text?: string }>(req)).text, 2000);
    if (text.length < 2) return fail('Please type a reply');

    await connectDB();
    const ticket = await Ticket.findById(id);
    if (!ticket) return fail('Ticket not found', 404);
    if (ticket.status === 'Closed') return fail('This ticket is closed');

    ticket.messages.push({ sender: 'staff', name: staff.name, text, createdAt: new Date() });
    if (ticket.status === 'Open') ticket.status = 'In Progress';
    await ticket.save();
    return NextResponse.json({ data: ticket });
  } catch (e) {
    return serverError(e);
  }
}

// PUT { status }
export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Ticket not found', 404);

    const { status } = await readJson<{ status?: string }>(req);
    if (!status || !(TICKET_STATUSES as readonly string[]).includes(status)) return fail('Invalid status');

    await connectDB();
    const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
    if (!ticket) return fail('Ticket not found', 404);
    return NextResponse.json({ data: ticket });
  } catch (e) {
    return serverError(e);
  }
}
