import { z } from 'zod';

export const dashboardStatsSchema = z.object({
  period: z.enum(['day', 'week', 'month', 'year']).optional().default('week'),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
