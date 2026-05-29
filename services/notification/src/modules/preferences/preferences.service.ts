import { preferenceRepository } from '../../repositories';
import type { PreferenceResponse, UpdatePreferenceInput } from './preferences.types';

function toResponse(pref: any): PreferenceResponse {
  return {
    userId: pref.userId,
    emailEnabled: pref.emailEnabled,
    smsEnabled: pref.smsEnabled,
    pushEnabled: pref.pushEnabled,
    createdAt: pref.createdAt.toISOString(),
    updatedAt: pref.updatedAt.toISOString(),
  };
}

export class PreferencesService {
  async getPreferences(userId: string): Promise<PreferenceResponse> {
    const prefs = await preferenceRepository.findByUserId(userId);

    if (!prefs) {
      return {
        userId,
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    return toResponse(prefs);
  }

  async updatePreferences(userId: string, input: UpdatePreferenceInput): Promise<PreferenceResponse> {
    const prefs = await preferenceRepository.upsert(userId, {
      emailEnabled: input.emailEnabled,
      smsEnabled: input.smsEnabled,
      pushEnabled: input.pushEnabled,
    });

    return toResponse(prefs);
  }
}

export const preferencesService = new PreferencesService();
