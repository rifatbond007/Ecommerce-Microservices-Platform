import { Response, NextFunction } from 'express';
import { addressesService } from './addresses.service';
import { AuthenticatedRequest } from '../../middleware';

export class AddressesController {
  async getAddresses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { type } = req.query;
      const addresses = await addressesService.getAddresses(userId, type as string);

      res.status(200).json({
        success: true,
        data: addresses,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAddressById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const address = await addressesService.getAddressById(id, userId);

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async createAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const address = await addressesService.createAddress(userId, req.body);

      res.status(201).json({
        success: true,
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const address = await addressesService.updateAddress(id, userId, req.body);

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await addressesService.deleteAddress(id, userId);

      res.status(200).json({
        success: true,
        message: 'Address deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async setDefaultAddress(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const { type } = req.body;
      const address = await addressesService.setDefaultAddress(id, userId, type || 'shipping');

      res.status(200).json({
        success: true,
        data: address,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const addressesController = new AddressesController();
