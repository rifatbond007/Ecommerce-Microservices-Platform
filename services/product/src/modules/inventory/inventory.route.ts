import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { warehouseController } from './inventory.controller';
import { authenticate, requireAdmin, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createInventorySchema, inventoryQuerySchema, createWarehouseSchema, updateWarehouseSchema } from './inventory.validator';

const router = Router();

router.get('/', optionalAuth, validate(inventoryQuerySchema), inventoryController.getInventories);

router.get('/product/:productId', optionalAuth, inventoryController.getInventoryByProductId);

router.get('/variant/:variantId', optionalAuth, inventoryController.getInventoryByVariantId);

router.get('/:id', optionalAuth, inventoryController.getInventoryById);

router.post('/', authenticate, requireAdmin, validate(createInventorySchema), inventoryController.createInventory);

router.post('/:id/adjust', authenticate, requireAdmin, inventoryController.adjustQuantity);

router.post('/:id/reserve', authenticate, requireAdmin, inventoryController.reserveQuantity);

router.post('/:id/release', authenticate, requireAdmin, inventoryController.releaseReservation);

router.delete('/:id', authenticate, requireAdmin, inventoryController.deleteInventory);

router.get('/warehouses/all', optionalAuth, warehouseController.getWarehouses);

router.get('/warehouses/:id', optionalAuth, warehouseController.getWarehouseById);

router.post('/warehouses', authenticate, requireAdmin, validate(createWarehouseSchema), warehouseController.createWarehouse);

router.put('/warehouses/:id', authenticate, requireAdmin, validate(updateWarehouseSchema), warehouseController.updateWarehouse);

router.delete('/warehouses/:id', authenticate, requireAdmin, warehouseController.deleteWarehouse);

export default router;
