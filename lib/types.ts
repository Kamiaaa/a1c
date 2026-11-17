/* Shapes returned by the API, shared by the dashboard and the Self Care portal. */

export type CustomerStatus = 'Active' | 'Suspended' | 'Disconnected';

export interface PlanDTO {
  _id?: string;
  id: string;
  name: string;
  price: number;
  image: string;
  features: string[];
}

export interface MeResponse {
  customer: {
    id: string;
    customerId: string;
    name: string;
    phone: string;
    email: string;
    address: string;
    planId: string | null;
    status: CustomerStatus;
    mustChangePassword: boolean;
    connectionDate: string;
    nextBillingDate: string | null;
    lastLoginAt: string | null;
    createdAt: string;
  };
  plan: PlanDTO | null;
  summary: {
    unpaidTotal: number;
    unpaidCount: number;
    openTickets: number;
    pendingRequest: { id: string; toPlanName: string; createdAt: string } | null;
  };
}

export interface InvoiceDTO {
  _id: string;
  invoiceNo: string;
  customerId: string;
  customerName: string;
  period: string;
  planName?: string;
  amount: number;
  dueDate: string;
  status: 'Unpaid' | 'Paid';
  paidAt?: string | null;
  paymentMethod?: string;
  createdAt: string;
}

export interface PackageRequestDTO {
  _id: string;
  customerId: string;
  customerName: string;
  fromPlanName?: string;
  fromPrice?: number;
  toPlanName: string;
  toPrice: number;
  note?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  staffNote?: string;
  processedBy?: { name: string };
  processedAt?: string;
  createdAt: string;
}

export interface TicketMessageDTO {
  sender: 'customer' | 'staff';
  name: string;
  text: string;
  createdAt: string;
}

export interface TicketDTO {
  _id: string;
  ticketNo: string;
  customerId: string;
  customerName: string;
  subject: string;
  category: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  messages?: TicketMessageDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRow {
  id: string;
  customerId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  planId: string | null;
  planName: string | null;
  planPrice: number | null;
  status: CustomerStatus;
  mustChangePassword: boolean;
  connectionDate: string;
  nextBillingDate: string | null;
  lastLoginAt: string | null;
  createdBy: string | null;
}
