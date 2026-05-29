import prisma from './prisma.client';

export class PreferenceRepository {
  async findByUserId(userId: string) {
    return prisma.notificationPreference.findUnique({ where: { userId } });
  }

  async upsert(userId: string, data: { emailEnabled?: boolean; smsEnabled?: boolean; pushEnabled?: boolean }) {
    return prisma.notificationPreference.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
  }
}

export const preferenceRepository = new PreferenceRepository();
