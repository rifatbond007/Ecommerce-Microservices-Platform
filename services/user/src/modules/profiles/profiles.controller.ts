import { Response, NextFunction } from 'express';
import { profilesService } from './profiles.service';
import { AuthenticatedRequest } from '../../middleware';

export class ProfilesController {
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await profilesService.getProfile(userId);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async createProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await profilesService.createProfile(userId, req.body);

      res.status(201).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const profile = await profilesService.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProfile(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      await profilesService.deleteProfile(userId);

      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const profilesController = new ProfilesController();
