// Skip this file if you already have a Cloudinary helper - just make sure uploadImage/deleteImage
// below (or your equivalents) are what the carousel routes import.
// Requires: npm i cloudinary   and   CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET
// (or a single CLOUDINARY_URL) in .env.local
import { v2 as cloudinary } from 'cloudinary';

if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export async function uploadImage(file: File, folder = 'a1c/carousel'): Promise<{ url: string; publicId: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder,
          resource_type: 'image',
          // keep originals sane: cap the longest side and let Cloudinary pick the quality
          transformation: [{ width: 2400, height: 2400, crop: 'limit' }, { quality: 'auto' }],
        },
        (err, res) => (err || !res ? reject(err ?? new Error('Cloudinary upload failed')) : resolve({ url: res.secure_url, publicId: res.public_id }))
      )
      .end(buffer);
  });
}

/** Best-effort delete; never throws (a leftover file must not block a DB change). */
export async function deleteImage(publicId?: string | null) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { invalidate: true });
  } catch (e) {
    console.error('[cloudinary] delete failed', publicId, e);
  }
}
