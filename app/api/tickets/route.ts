import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, serverError } from '@/lib/api';
import { Ticket, TICKET_STATUSES } from '@/models/Ticket';

export async function GET(req: Request) {
  try {
    if (!(await getStaff())) return fail('Unauthorized', 403);
    const status = new URL(req.url).searchParams.get('status');
    const filter: Record<string, unknown> = status && (TICKET_STATUSES as readonly string[]).includes(status) ? { status } : {};
    await connectDB();
    const data = await Ticket.find(filter).select('-messages').sort({ updatedAt: -1 }).limit(300);
    return NextResponse.json({ data });
  } catch (e) {
    return serverError(e);
  }
}
