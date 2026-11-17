import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, isObjectId, readJson, serverError, str } from '@/lib/api';
import { PackageRequest } from '@/models/PackageRequest';
import { Customer } from '@/models/Customer';
import Plan from '@/models/Plan';

// PUT { action: 'approve' | 'reject', staffNote? }
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const staff = await getStaff();
    if (!staff) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Request not found', 404);

    const body = await readJson<{ action?: string; staffNote?: string }>(req);
    if (body.action !== 'approve' && body.action !== 'reject') return fail('Invalid action');

    await connectDB();
    const request = await PackageRequest.findById(id);
    if (!request) return fail('Request not found', 404);
    if (request.status !== 'Pending') return fail(`This request is already ${request.status.toLowerCase()}`, 409);

    if (body.action === 'approve') {
      const [customer, plan] = await Promise.all([Customer.findById(request.customer), Plan.findOne({ id: request.toPlanId })]);
      if (!customer) return fail('Customer no longer exists', 404);
      if (!plan) return fail('The requested package no longer exists', 404);
      customer.planId = plan.id;
      await customer.save();
      request.status = 'Approved';
    } else {
      request.status = 'Rejected';
    }

    request.staffNote = str(body.staffNote, 500);
    request.processedAt = new Date();
    request.processedBy = { id: staff.id, name: staff.name, role: staff.role };
    await request.save();

    return NextResponse.json({ data: request });
  } catch (e) {
    return serverError(e);
  }
}
