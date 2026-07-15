import prisma from './prisma.client';

export class SearchLogRepository {
  async log(data: { userId?: string; query: string; filters?: Record<string, unknown>; resultsCount: number }) {
    return prisma.searchLog.create({
      data: {
        userId: data.userId || null,
        query: data.query,
        filters: (data.filters || {}) as any,
        resultsCount: data.resultsCount,
      },
    });
  }

  async getTrending(limit = 10) {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT query, COUNT(*) as count FROM search_logs
       WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY query ORDER BY count DESC LIMIT $1`,
      limit
    )) as Array<{ query: string; count: bigint }>;
    return rows.map((r: { query: string; count: bigint }) => ({ query: r.query, count: Number(r.count) }));
  }

  async getPopular(limit = 10) {
    const rows = (await prisma.$queryRawUnsafe(
      `SELECT query, COUNT(*) as count FROM search_logs
       GROUP BY query ORDER BY count DESC LIMIT $1`,
      limit
    )) as Array<{ query: string; count: bigint }>;
    return rows.map((r: { query: string; count: bigint }) => ({ query: r.query, count: Number(r.count) }));
  }

  async click(productId: string, logId?: string) {
    if (logId) {
      await prisma.searchLog.update({
        where: { id: logId },
        data: { clickedProductId: productId },
      });
    }
  }
}

export const searchLogRepository = new SearchLogRepository();
