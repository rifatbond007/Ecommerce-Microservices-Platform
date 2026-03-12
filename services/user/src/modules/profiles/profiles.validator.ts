import { z } from 'zod';

export const createProfileSchema = z.object({
  body: z.object({
    dateOfBirth: z.string().optional(),
    gender: z.string().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    bio: z.string().optional(),
    website: z.string().url().optional(),
    company: z.string().optional(),
    jobTitle: z.string().optional(),
    newsletterSubscribed: z.boolean().optional(),
    notificationPreferences: z.record(z.unknown()).optional(),
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    dateOfBirth: z.string().nullable().optional(),
    gender: z.string().nullable().optional(),
    language: z.string().optional(),
    timezone: z.string().optional(),
    currency: z.string().optional(),
    bio: z.string().nullable().optional(),
    website: z.string().url().nullable().optional(),
    company: z.string().nullable().optional(),
    jobTitle: z.string().nullable().optional(),
    newsletterSubscribed: z.boolean().optional(),
    notificationPreferences: z.record(z.unknown()).optional(),
  }),
});

export type CreateProfileInput = z.infer<typeof createProfileSchema>['body'];
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
