import connectDB from '@/lib/db';
import { Slide, type ISlide } from '@/models/Slide';
import type { CarouselSlide } from '@/app/(main)/components/carousel/Carousel';

/* ---------- public shape used by the <Carousel /> component ---------- */
export function toCarouselSlide(s: ISlide): CarouselSlide {
  return {
    id: s._id.toString(),
    title: s.title,
    eyebrow: s.eyebrow || undefined,
    image: s.image,
    imageAlt: s.imageAlt || s.title,
    primaryCta: { label: s.primaryLabel, href: s.primaryHref },
    secondaryCta: { label: s.secondaryLabel, href: s.secondaryHref },
  };
}

/** Active slides in display order. Returns [] on any error so the page can fall back to defaults. */
export async function getActiveSlides(): Promise<CarouselSlide[]> {
  try {
    await connectDB();
    const docs = await Slide.find({ isActive: true }).sort({ order: 1, createdAt: 1 });
    return docs.map(toCarouselSlide);
  } catch (e) {
    console.error('[carousel] could not load slides', e);
    return [];
  }
}

/* ---------- full shape used by the dashboard ---------- */
export function toAdminSlide(s: ISlide) {
  return {
    id: s._id.toString(),
    title: s.title,
    eyebrow: s.eyebrow ?? '',
    image: s.image,
    imageAlt: s.imageAlt ?? '',
    primaryLabel: s.primaryLabel,
    primaryHref: s.primaryHref,
    secondaryLabel: s.secondaryLabel,
    secondaryHref: s.secondaryHref,
    order: s.order,
    isActive: s.isActive,
    updatedAt: s.updatedAt,
  };
}

/* ---------- form parsing / validation (shared by POST + PUT) ---------- */
const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // stays under common 4.5 MB serverless body limits
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function imageError(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Image must be JPG, PNG, WebP or AVIF';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 4 MB or smaller';
  return null;
}

/** Only relative links, #anchors and http(s)/tel/mailto - blocks javascript: and friends. */
function safeHref(v: string, fallback: string): string | null {
  const href = v.trim() || fallback;
  return /^(\/(?!\/)|#|https?:\/\/|tel:|mailto:)/i.test(href) ? href : null;
}

const text = (form: FormData, key: string, max: number) => {
  const v = form.get(key);
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
};

export function parseSlideForm(form: FormData): { error: string } | { data: Pick<ISlide, 'title' | 'eyebrow' | 'imageAlt' | 'primaryLabel' | 'primaryHref' | 'secondaryLabel' | 'secondaryHref' | 'isActive'> } {
  const title = text(form, 'title', 120);
  if (title.length < 2) return { error: 'Title is required' };

  const primaryHref = safeHref(text(form, 'primaryHref', 300), '#price');
  const secondaryHref = safeHref(text(form, 'secondaryHref', 300), '/home-internet');
  if (!primaryHref || !secondaryHref) return { error: 'Button links must start with /, #, http(s)://, tel: or mailto:' };

  return {
    data: {
      title,
      eyebrow: text(form, 'eyebrow', 80),
      imageAlt: text(form, 'imageAlt', 160),
      primaryLabel: text(form, 'primaryLabel', 30) || 'Package Plans',
      primaryHref,
      secondaryLabel: text(form, 'secondaryLabel', 30) || 'Get Now',
      secondaryHref,
      isActive: form.get('isActive') !== 'false',
    },
  };
}
