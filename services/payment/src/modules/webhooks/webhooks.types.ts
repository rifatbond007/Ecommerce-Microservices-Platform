export interface StripeWebhookEvent {
  id: string;
  type: string;
  data: {
    object: {
      id: string;
      amount?: number;
      currency?: string;
      latest_charge?: string;
      last_payment_error?: { message?: string };
      metadata?: Record<string, string>;
    };
  };
  created: number;
  livemode: boolean;
}

export interface GenericWebhookEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp?: string;
  source?: string;
}

export type WebhookEvent = StripeWebhookEvent | GenericWebhookEvent;
