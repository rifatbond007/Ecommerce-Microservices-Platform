import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export interface CreateOrderInput {
  cartId: string;
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethod?: string;
  notes?: string;
}

export interface UpdateOrderStatusInput {
  status: string;
  note?: string;
}

export interface CreateReturnInput {
  reason: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}
