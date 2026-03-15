import { Prisma } from '@prisma/client';
import prisma from './prisma.client';

export interface CreateProfileData {
  userId: string;
  dateOfBirth?: Date;
  gender?: string;
  language?: string;
  timezone?: string;
  currency?: string;
  bio?: string;
  website?: string;
  company?: string;
  jobTitle?: string;
  newsletterSubscribed?: boolean;
  notificationPreferences?: Prisma.InputJsonValue;
}

export interface UpdateProfileData {
  dateOfBirth?: Date | null;
  gender?: string | null;
  language?: string;
  timezone?: string;
  currency?: string;
  bio?: string | null;
  website?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  newsletterSubscribed?: boolean;
  notificationPreferences?: Prisma.InputJsonValue;
}

export class ProfileRepository {
  async findByUserId(userId: string) {
    return prisma.profile.findUnique({
      where: { userId },
    });
  }

  async create(data: CreateProfileData) {
    return prisma.profile.create({
      data: {
        userId: data.userId,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        language: data.language,
        timezone: data.timezone,
        currency: data.currency,
        bio: data.bio,
        website: data.website,
        company: data.company,
        jobTitle: data.jobTitle,
        newsletterSubscribed: data.newsletterSubscribed,
        notificationPreferences: data.notificationPreferences,
      },
    });
  }

  async update(userId: string, data: UpdateProfileData) {
    return prisma.profile.update({
      where: { userId },
      data,
    });
  }

  async delete(userId: string) {
    return prisma.profile.delete({
      where: { userId },
    });
  }
}

export const profileRepository = new ProfileRepository();
