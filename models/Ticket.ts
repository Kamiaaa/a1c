import mongoose, { Schema, Document, Model, Types } from 'mongoose';

export const TICKET_CATEGORIES = ['Connection Issue', 'Slow Speed', 'Billing', 'Package', 'Other'] as const;
export const TICKET_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'] as const;

export interface ITicketMessage {
  sender: 'customer' | 'staff';
  name: string;
  text: string;
  createdAt: Date;
}

export interface ITicket extends Document {
  ticketNo: string;
  customer: Types.ObjectId;
  customerId: string;
  customerName: string;
  subject: string;
  category: (typeof TICKET_CATEGORIES)[number];
  status: (typeof TICKET_STATUSES)[number];
  messages: ITicketMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<ITicketMessage>(
  {
    sender: { type: String, enum: ['customer', 'staff'], required: true },
    name: { type: String, required: true },
    text: { type: String, required: true, maxlength: 2000 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const TicketSchema = new Schema<ITicket>(
  {
    ticketNo: { type: String, required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerId: { type: String, required: true },
    customerName: { type: String, required: true },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    category: { type: String, enum: TICKET_CATEGORIES, default: 'Other' },
    status: { type: String, enum: TICKET_STATUSES, default: 'Open' },
    messages: { type: [MessageSchema], default: [] },
  },
  { timestamps: true }
);

export const Ticket: Model<ITicket> =
  mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
