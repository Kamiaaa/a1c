import { deleteImage } from '@/lib/cloudinary';

/** Upload limits shared by every image upload in the dashboard. */
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024; // stays under common 4.5 MB serverless body limits
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

export function checkImageFile(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Image must be JPG, PNG, WebP or AVIF';
  if (file.size > MAX_IMAGE_BYTES) return 'Image must be 4 MB or smaller';
  return null;
}

/**
 * "https://res.cloudinary.com/<cloud>/image/upload/v169/a1c/plans/abc.jpg" -> "a1c/plans/abc"
 * Returns null for local paths (/img/x.jpg), other hosts, or anything outside our own a1c/ folders,
 * so we can never delete an asset we did not upload.
 */
export function publicIdFromUrl(url?: string | null): string | null {
  if (!url) return null;
  const m = url.match(/^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/(?:[^/]+\/)*?v\d+\/(.+)\.[A-Za-z0-9]+$/);
  const id = m?.[1] ? decodeURIComponent(m[1]) : null;
  return id && id.startsWith('a1c/') ? id : null;
}

/** Best-effort: removes the Cloudinary file behind a stored image URL (no-op for local /img paths). */
export async function deleteImageByUrl(url?: string | null) {
  const id = publicIdFromUrl(url);
  if (id) await deleteImage(id);
}
