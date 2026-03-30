import { z } from 'zod';

export const dashboardStatsSchema = z.object({
  period: z.enum(['today', 'week', 'month', 'year']).optional().default('week'),
});

export type DashboardStats = z.infer<typeof dashboardStatsSchema>;
