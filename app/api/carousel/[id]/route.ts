import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import { getStaff } from '@/lib/session';
import { fail, isObjectId, serverError } from '@/lib/api';
import { deleteImage, uploadImage } from '@/lib/cloudinary';
import { imageError, parseSlideForm, toAdminSlide } from '@/lib/carousel';
import { Slide } from '@/models/Slide';

const MANAGERS = ['admin' as const];
type Ctx = { params: Promise<{ id: string }> };

// PUT multipart/form-data - same fields as POST; `image` is optional (omit to keep the current one)
export async function PUT(req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff(MANAGERS))) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Slide not found', 404);

    const form = await req.formData().catch(() => null);
    if (!form) return fail('Invalid form data');
    const parsed = parseSlideForm(form);
    if ('error' in parsed) return fail(parsed.error);

    await connectDB();
    const slide = await Slide.findById(id);
    if (!slide) return fail('Slide not found', 404);

    const file = form.get('image');
    let oldPublicId: string | undefined;
    if (file instanceof File && file.size > 0) {
      const bad = imageError(file);
      if (bad) return fail(bad);
      const up = await uploadImage(file);
      oldPublicId = slide.imagePublicId;
      slide.image = up.url;
      slide.imagePublicId = up.publicId;
    }

    Object.assign(slide, parsed.data);
    await slide.save();
    await deleteImage(oldPublicId); // only after the DB points at the new image

    revalidatePath('/');
    return NextResponse.json({ data: toAdminSlide(slide) });
  } catch (e) {
    return serverError(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    if (!(await getStaff(MANAGERS))) return fail('Unauthorized', 403);
    const { id } = await params;
    if (!isObjectId(id)) return fail('Slide not found', 404);

    await connectDB();
    const slide = await Slide.findByIdAndDelete(id);
    if (!slide) return fail('Slide not found', 404);
    await deleteImage(slide.imagePublicId);

    revalidatePath('/');
    return NextResponse.json({ message: 'Slide deleted' });
  } catch (e) {
    return serverError(e);
  }
}
