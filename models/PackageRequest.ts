import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const REQUEST_STATUSES = ['Pending', 'Approved', 'Rejected', 'Cancelled'] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export interface IPackageRequest extends Document {
  customer: Types.ObjectId;
  customerId: string;
  customerName: string;
  fromPlanId?: string | null;
  fromPlanName?: string;
  fromPrice?: number;
  toPlanId: string;
  toPlanName: string;
  toPrice: number;
  note?: string;
  status: RequestStatus;
  staffNote?: string;
  processedBy?: { id: string; name: string; role: string };
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PackageRequestSchema = new Schema<IPackageRequest>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    fromPlanId: { type: String, default: null },
    fromPlanName: String,
    fromPrice: Number,
    toPlanId: { type: String, required: true },
    toPlanName: { type: String, required: true },
    toPrice: { type: Number, required: true },
    note: { type: String, maxlength: 500 },
    status: { type: String, enum: REQUEST_STATUSES, default: 'Pending' },
    staffNote: { type: String, maxlength: 500 },
    processedBy: { id: String, name: String, role: String },
    processedAt: Date,
  },
  { timestamps: true }
);

export const PackageRequest: Model<IPackageRequest> =
  mongoose.models.PackageRequest || mongoose.model<IPackageRequest>('PackageRequest', PackageRequestSchema);
