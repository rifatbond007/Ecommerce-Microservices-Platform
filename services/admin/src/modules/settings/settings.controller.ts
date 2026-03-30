import { Response, NextFunction } from 'express';
import { settingsService } from './settings.service';
import { validateQuery, validate } from '../../utils/validate';
import { settingSchema, settingQuerySchema } from './settings.types';
import type { AuthRequest } from '../../middleware';

export class SettingsController {
  async getSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const query = validateQuery(settingQuerySchema, req.query);
      const result = await settingsService.findAll(query, req.user!.id);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSetting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const result = await settingsService.findByKey(key, req.user!.id);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateSetting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const input = validate(settingSchema, req.body);
      const result = await settingsService.upsert(input, req.user!.id, req.ip);
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteSetting(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { key } = req.params;
      const result = await settingsService.delete(key, req.user!.id, req.ip);
      
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  async getPublicSettings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await settingsService.getPublicSettings();
      
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const settingsController = new SettingsController();
