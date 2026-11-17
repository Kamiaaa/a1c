import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISlide extends Document {
  title: string;
  eyebrow?: string;
  image: string; // public URL (Cloudinary secure_url, or a /public path)
  imagePublicId?: string; // Cloudinary public_id, used to delete the old file
  imageAlt?: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SlideSchema = new Schema<ISlide>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    eyebrow: { type: String, trim: true, maxlength: 80 },
    image: { type: String, required: true },
    imagePublicId: { type: String },
    imageAlt: { type: String, trim: true, maxlength: 160 },
    primaryLabel: { type: String, default: 'Package Plans', trim: true, maxlength: 30 },
    primaryHref: { type: String, default: '#price', trim: true },
    secondaryLabel: { type: String, default: 'Get Now', trim: true, maxlength: 30 },
    secondaryHref: { type: String, default: '/home-internet', trim: true },
    order: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Slide: Model<ISlide> = mongoose.models.Slide || mongoose.model<ISlide>('Slide', SlideSchema);
