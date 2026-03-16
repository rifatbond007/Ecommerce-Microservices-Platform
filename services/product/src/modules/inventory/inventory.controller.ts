import { Response, NextFunction } from 'express';
import { inventoryService, warehouseService } from './inventory.service';
import type { AuthenticatedRequest } from '../../middleware';

export class InventoryController {
  async getInventories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await inventoryService.getInventories(req.query as any);
      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.getInventoryById(req.params.id);
      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryByProductId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const inventories = await inventoryService.getInventoryByProductId(req.params.productId);
      res.status(200).json({
        success: true,
        data: inventories,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInventoryByVariantId(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.getInventoryByVariantId(req.params.variantId);
      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  async createInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const inventory = await inventoryService.createInventory(req.body);
      res.status(201).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustQuantity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { adjustment } = req.body;
      const inventory = await inventoryService.adjustQuantity(req.params.id, adjustment);
      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  async reserveQuantity(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      const inventory = await inventoryService.reserveQuantity(req.params.id, quantity);
      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  async releaseReservation(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { quantity } = req.body;
      const inventory = await inventoryService.releaseReservation(req.params.id, quantity);
      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await inventoryService.deleteInventory(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Inventory deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export class WarehouseController {
  async getWarehouses(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const includeInactive = req.query.includeInactive === 'true';
      const warehouses = await warehouseService.getAllWarehouses(includeInactive);
      res.status(200).json({
        success: true,
        data: warehouses,
      });
    } catch (error) {
      next(error);
    }
  }

  async getWarehouseById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warehouse = await warehouseService.getWarehouseById(req.params.id);
      res.status(200).json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async createWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warehouse = await warehouseService.createWarehouse(req.body);
      res.status(201).json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const warehouse = await warehouseService.updateWarehouse(req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: warehouse,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteWarehouse(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await warehouseService.deleteWarehouse(req.params.id);
      res.status(200).json({
        success: true,
        message: 'Warehouse deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
export const warehouseController = new WarehouseController();
