import prisma from './prisma.client';

export class AdminLogRepository {
  async create(data: {
    action: string;
    entityType: string;
    entityId?: string;
    userId?: string;
    details?: Record<string, any>;
    ipAddress?: string;
  }) {
    return prisma.adminLog.create({ data });
  }

  async findByEntity(entityType: string, entityId: string, limit = 50) {
    return prisma.adminLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findByUser(userId: string, limit = 50) {
    return prisma.adminLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async findAll(limit = 100, offset = 0) {
    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.adminLog.count(),
    ]);
    return { logs, total };
  }
}

export const adminLogRepository = new AdminLogRepository();
