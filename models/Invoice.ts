import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export interface IInvoice extends Document {
  invoiceNo: string;
  customer: Types.ObjectId;
  customerId: string;
  customerName: string;
  period: string; // e.g. "November 2026"
  planName?: string;
  amount: number;
  dueDate: Date;
  status: 'Unpaid' | 'Paid';
  paidAt?: Date | null;
  paymentMethod?: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoiceNo: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    period: { type: String, required: true, trim: true },
    planName: String,
    amount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ['Unpaid', 'Paid'], default: 'Unpaid' },
    paidAt: { type: Date, default: null },
    paymentMethod: String,
    createdBy: String,
  },
  { timestamps: true }
);

export const Invoice: Model<IInvoice> =
  mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);
