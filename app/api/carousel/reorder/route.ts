import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, isObjectId, readJson, serverError } from '@/lib/api';
import { Slide } from '@/models/Slide';

// PUT { ids: ["<slideId>", ...] }  -> first id becomes order 0, and so on
export async function PUT(req: Request) {
  try {
    if (!(await getStaff(['admin']))) return fail('Unauthorized', 403);

    const { ids } = await readJson<{ ids?: unknown }>(req);
    if (!Array.isArray(ids) || ids.length === 0 || !ids.every(isObjectId) || new Set(ids).size !== ids.length) {
      return fail('Provide a list of unique slide ids');
    }

    await connectDB();
    await Slide.bulkWrite(ids.map((id, order) => ({ updateOne: { filter: { _id: id }, update: { $set: { order } } } })));

    revalidatePath('/');
    return NextResponse.json({ message: 'Order saved' });
  } catch (e) {
    return serverError(e);
  }
}
