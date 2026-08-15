import { Response, NextFunction } from 'express';
import { sellersService } from './sellers.service';
import { AuthenticatedRequest } from '../../middleware';

const getToken = (req: AuthenticatedRequest): string =>
  req.headers.authorization?.replace('Bearer ', '') || '';

export class SellersController {
  async getSellerStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const status = await sellersService.getSellerStatus(getToken(req));
      res.status(200).json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  }

  async requestSeller(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await sellersService.requestSeller(getToken(req));
      res.status(200).json({
        success: true,
        message: 'Seller request submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSellerRequests(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const requests = await sellersService.getSellerRequests(getToken(req));
      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }

  async approveSeller(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      await sellersService.approveSeller(getToken(req), userId);
      res.status(200).json({
        success: true,
        message: 'Seller approved successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async rejectSeller(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      await sellersService.rejectSeller(getToken(req), userId);
      res.status(200).json({
        success: true,
        message: 'Seller request rejected',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const sellersController = new SellersController();
