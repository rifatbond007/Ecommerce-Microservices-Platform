import { settingsRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import { dashboardService } from '../dashboard/dashboard.service';
import type { SettingInput, SettingQueryInput } from './settings.types';

export class SettingsService {
  async findAll(query: SettingQueryInput, _adminId: string) {
    return settingsRepository.findAll(query.category);
  }

  async findByKey(key: string, _adminId: string) {
    const setting = await settingsRepository.findByKey(key);
    if (!setting) {
      throw new NotFoundError('Setting');
    }
    return setting;
  }

  async upsert(input: SettingInput, adminId: string, ipAddress?: string) {
    const result = await settingsRepository.upsert(input.key, input.value, input.type, input.category);

    await dashboardService.logAction({
      action: 'UPDATE_SETTING',
      entityType: 'setting',
      entityId: input.key,
      userId: adminId,
      details: { key: input.key, category: input.category },
      ipAddress,
    });

    return result;
  }

  async delete(key: string, adminId: string, ipAddress?: string) {
    await settingsRepository.delete(key);

    await dashboardService.logAction({
      action: 'DELETE_SETTING',
      entityType: 'setting',
      entityId: key,
      userId: adminId,
      ipAddress,
    });

    return { success: true, message: 'Setting deleted successfully' };
  }

  async getPublicSettings() {
    return settingsRepository.findAll();
  }
}

export const settingsService = new SettingsService();
