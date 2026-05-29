import { z } from 'zod';

export const notificationIdSchema = z.object({
  id: z.string().uuid(),
});

export const notificationQuerySchema = z.object({
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 20)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
  unreadOnly: z.string().optional().transform((val) => val === 'true'),
});
