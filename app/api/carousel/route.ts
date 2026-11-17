import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, serverError } from '@/lib/api';
import { uploadImage } from '@/lib/cloudinary';
import { imageError, parseSlideForm, toAdminSlide } from '@/lib/carousel';
import { Slide } from '@/models/Slide';

// Who may manage the homepage carousel. Use getStaff() (no args) to also allow moderators.
const MANAGERS = ['admin' as const];

// GET /api/carousel          -> public, active slides only
// GET /api/carousel?all=1    -> staff, every slide (dashboard)
export async function GET(req: Request) {
  try {
    const all = new URL(req.url).searchParams.get('all') === '1';
    if (all && !(await getStaff(MANAGERS))) return fail('Unauthorized', 403);

    await connectDB();
    const docs = await Slide.find(all ? {} : { isActive: true }).sort({ order: 1, createdAt: 1 });
    return NextResponse.json({ data: docs.map(toAdminSlide) });
  } catch (e) {
    return serverError(e);
  }
}

// POST multipart/form-data: image (file, required), title, eyebrow, imageAlt, primaryLabel, primaryHref, secondaryLabel, secondaryHref, isActive
export async function POST(req: Request) {
  try {
    if (!(await getStaff(MANAGERS))) return fail('Unauthorized', 403);

    const form = await req.formData().catch(() => null);
    if (!form) return fail('Invalid form data');

    const parsed = parseSlideForm(form);
    if ('error' in parsed) return fail(parsed.error);

    const file = form.get('image');
    if (!(file instanceof File) || file.size === 0) return fail('Please choose an image');
    const bad = imageError(file);
    if (bad) return fail(bad);

    await connectDB();
    const last = await Slide.findOne().sort({ order: -1 }).select('order');
    const { url, publicId } = await uploadImage(file);

    const slide = await Slide.create({
      ...parsed.data,
      image: url,
      imagePublicId: publicId,
      order: (last?.order ?? -1) + 1,
    });

    revalidatePath('/');
    return NextResponse.json({ data: toAdminSlide(slide) }, { status: 201 });
  } catch (e) {
    return serverError(e);
  }
}
