import mongoose, { Schema, Document, Model } from 'mongoose';

export const CUSTOMER_STATUSES = ['Active', 'Suspended', 'Disconnected'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export interface ICustomer extends Document {
  customerId: string; // A1C + digits - what the customer types to log in
  name: string;
  phone: string;
  email?: string;
  address?: string;
  password: string; // bcrypt hash
  mustChangePassword: boolean;
  tokenVersion: number; // bump to invalidate every active session
  planId?: string | null; // Plan.id (slug)
  status: CustomerStatus;
  connectionDate: Date;
  nextBillingDate?: Date | null;
  lastLoginAt?: Date | null;
  createdBy?: { id: string; name: string; role: string };
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    customerId: { type: String, required: true, unique: true, uppercase: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    mustChangePassword: { type: Boolean, default: true },
    tokenVersion: { type: Number, default: 0 },
    planId: { type: String, default: null },
    status: { type: String, enum: CUSTOMER_STATUSES, default: 'Active' },
    connectionDate: { type: Date, default: Date.now },
    nextBillingDate: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    createdBy: { id: String, name: String, role: String },
  },
  { timestamps: true }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
