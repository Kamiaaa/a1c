import { NextResponse } from 'next/server';
import { requireCustomer } from '@/lib/session';
import { fail, readJson, serverError, str } from '@/lib/api';
import Plan from '@/models/Plan';
import { PackageRequest } from '@/models/PackageRequest';

export async function GET() {
  try {
    const auth = await requireCustomer();
    if (!auth.ok) return auth.response;
    const data = await PackageRequest.find({ customer: auth.customer._id }).sort({ createdAt: -1 }).limit(30);
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

    const body = await readJson<{ planId?: string; note?: string }>(req);
    const planId = str(body.planId, 80);
    if (!planId) return fail('Please choose a package');

    if (customer.status === 'Disconnected') {
      return fail('Your connection is currently disconnected. Please contact support to reconnect.');
    }

    const plan = await Plan.findOne({ id: planId });
    if (!plan) return fail('Package not found', 404);
    if (plan.id === customer.planId) return fail('You are already on this package');

    if (await PackageRequest.exists({ customer: customer._id, status: 'Pending' })) {
      return fail('You already have a pending package change request. Cancel it first to submit a new one.', 409);
    }

    const current = customer.planId ? await Plan.findOne({ id: customer.planId }) : null;
    const request = await PackageRequest.create({
      customer: customer._id,
      customerId: customer.customerId,
      customerName: customer.name,
      fromPlanId: current?.id ?? null,
      fromPlanName: current?.name,
      fromPrice: current?.price,
      toPlanId: plan.id,
      toPlanName: plan.name,
      toPrice: plan.price,
      note: str(body.note, 500),
    });

    // Optional: apply instantly instead of waiting for staff approval
    const autoApprove = process.env.SELF_CARE_AUTO_APPROVE_PACKAGE_CHANGE === 'true';
    if (autoApprove) {
      customer.planId = plan.id;
      await customer.save();
      request.status = 'Approved';
      request.processedAt = new Date();
      request.processedBy = { id: 'system', name: 'Auto-approved', role: 'system' };
      await request.save();
    }

    return NextResponse.json({ data: request, applied: autoApprove }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
