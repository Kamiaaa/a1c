/* Client-safe helpers (no Cloudinary SDK import). */

const CLOUDINARY_UPLOAD = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(v\d+\/.+)$/;

/**
 * Adds Cloudinary's on-the-fly optimisation (modern format + smart quality + a sensible max width)
 * to an image we uploaded. Needed because next.config has `images.unoptimized: true`, so Next.js
 * itself will not resize or compress anything. Local /img/... paths and other hosts pass through unchanged.
 */
export function cloudinaryOptimized(url: string, width = 800): string {
  const m = url.match(CLOUDINARY_UPLOAD);
  if (!m) return url;
  return `${m[1]}f_auto,q_auto,c_limit,w_${width}/${m[2]}`;
}
