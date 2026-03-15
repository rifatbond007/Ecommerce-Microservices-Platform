import { Prisma } from '@prisma/client';
import { profileRepository } from '../../repositories';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateProfileInput, UpdateProfileInput } from './profiles.validator';

export interface ProfileResponse {
  userId: string;
  dateOfBirth: Date | null;
  gender: string | null;
  language: string;
  timezone: string;
  currency: string;
  bio: string | null;
  website: string | null;
  company: string | null;
  jobTitle: string | null;
  newsletterSubscribed: boolean;
  notificationPreferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class ProfilesService {
  async getProfile(userId: string): Promise<ProfileResponse> {
    const profile = await profileRepository.findByUserId(userId);

    if (!profile) {
      throw new NotFoundError('Profile');
    }

    return this.formatProfileResponse(profile);
  }

  async createProfile(userId: string, input: CreateProfileInput): Promise<ProfileResponse> {
    const existing = await profileRepository.findByUserId(userId);

    if (existing) {
      throw new ConflictError('Profile already exists');
    }

    const profile = await profileRepository.create({
      userId,
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
      gender: input.gender,
      language: input.language,
      timezone: input.timezone,
      currency: input.currency,
      bio: input.bio,
      website: input.website,
      company: input.company,
      jobTitle: input.jobTitle,
      newsletterSubscribed: input.newsletterSubscribed,
      notificationPreferences: input.notificationPreferences as Prisma.InputJsonValue | undefined,
    });

    logger.info('Profile created', { userId });

    return this.formatProfileResponse(profile);
  }

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<ProfileResponse> {
    const existing = await profileRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundError('Profile');
    }

    const profile = await profileRepository.update(userId, {
      dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null,
      gender: input.gender,
      language: input.language,
      timezone: input.timezone,
      currency: input.currency,
      bio: input.bio,
      website: input.website,
      company: input.company,
      jobTitle: input.jobTitle,
      newsletterSubscribed: input.newsletterSubscribed,
      notificationPreferences: input.notificationPreferences as Prisma.InputJsonValue | undefined,
    });

    logger.info('Profile updated', { userId });

    return this.formatProfileResponse(profile);
  }

  async deleteProfile(userId: string): Promise<void> {
    const existing = await profileRepository.findByUserId(userId);

    if (!existing) {
      throw new NotFoundError('Profile');
    }

    await profileRepository.delete(userId);

    logger.info('Profile deleted', { userId });
  }

  private formatProfileResponse(profile: any): ProfileResponse {
    return {
      userId: profile.userId,
      dateOfBirth: profile.dateOfBirth,
      gender: profile.gender,
      language: profile.language,
      timezone: profile.timezone,
      currency: profile.currency,
      bio: profile.bio,
      website: profile.website,
      company: profile.company,
      jobTitle: profile.jobTitle,
      newsletterSubscribed: profile.newsletterSubscribed,
      notificationPreferences: profile.notificationPreferences,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}

export const profilesService = new ProfilesService();
