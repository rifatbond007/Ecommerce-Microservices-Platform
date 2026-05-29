export interface ProcessPaymentInput {
  orderId: string;
  paymentMethod: string;
  paymentMethodId?: string;
  savePaymentMethod?: boolean;
}

export interface RefundInput {
  amount?: number;
  reason: string;
}

export interface PaymentResponse {
  id: string;
  orderId: string;
  userId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string | null;
  paymentIntentId: string | null;
  transactionId: string | null;
  metadata: Record<string, unknown>;
  failureMessage: string | null;
  paidAt: string | null;
  failedAt: string | null;
  createdAt: string;
  updatedAt: string;
  refunds?: RefundResponse[];
}

export interface RefundResponse {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  reason: string | null;
  status: string;
  refundId: string | null;
  refundedAt: string | null;
  createdAt: string;
}
