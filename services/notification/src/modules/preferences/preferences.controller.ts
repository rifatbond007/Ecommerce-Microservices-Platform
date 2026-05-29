import { Response, NextFunction } from 'express';
import { preferencesService } from './preferences.service';
import { AuthenticatedRequest } from '../../middleware';
import type { UpdatePreferenceInput } from './preferences.types';

export class PreferencesController {
  async getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const prefs = await preferencesService.getPreferences(userId);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }

  async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const input: UpdatePreferenceInput = req.body;
      const prefs = await preferencesService.updatePreferences(userId, input);
      res.status(200).json({ success: true, data: prefs });
    } catch (error) {
      next(error);
    }
  }
}

export const preferencesController = new PreferencesController();
