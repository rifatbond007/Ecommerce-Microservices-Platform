export interface NotificationResponse {
  id: string;
  userId: string;
  type: string;
  channel: string;
  title: string;
  content: string;
  data: Record<string, unknown>;
  status: string;
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  channel: string;
  title: string;
  content: string;
  data?: Record<string, unknown>;
  status?: string;
}
