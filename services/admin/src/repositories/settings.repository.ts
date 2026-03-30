import prisma from './prisma.client';

export class SettingsRepository {
  async findByKey(key: string) {
    return prisma.systemSetting.findUnique({ where: { key } });
  }

  async findAll(category?: string) {
    return prisma.systemSetting.findMany({
      where: category ? { category } : undefined,
      orderBy: { category: 'asc' },
    });
  }

  async upsert(key: string, value: string, type = 'string', category = 'general') {
    return prisma.systemSetting.upsert({
      where: { key },
      update: { value, type, category },
      create: { key, value, type, category },
    });
  }

  async delete(key: string) {
    return prisma.systemSetting.delete({ where: { key } });
  }
}

export const settingsRepository = new SettingsRepository();
