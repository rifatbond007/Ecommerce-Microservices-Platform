import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { warehouseController } from './inventory.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createInventorySchema, inventoryQuerySchema, createWarehouseSchema, updateWarehouseSchema } from './inventory.validator';

const router = Router();

router.get('/', optionalAuth, validate(inventoryQuerySchema), inventoryController.getInventories);

router.get('/product/:productId', optionalAuth, inventoryController.getInventoryByProductId);

router.get('/variant/:variantId', optionalAuth, inventoryController.getInventoryByVariantId);

router.get('/:id', optionalAuth, inventoryController.getInventoryById);

router.post('/', authenticate, requireAdminOrSeller, validate(createInventorySchema), inventoryController.createInventory);

router.post('/:id/adjust', authenticate, requireAdminOrSeller, inventoryController.adjustQuantity);

router.post('/:id/reserve', authenticate, requireAdminOrSeller, inventoryController.reserveQuantity);

router.post('/:id/release', authenticate, requireAdminOrSeller, inventoryController.releaseReservation);

router.delete('/:id', authenticate, requireAdminOrSeller, inventoryController.deleteInventory);

router.get('/warehouses/all', optionalAuth, warehouseController.getWarehouses);

router.get('/warehouses/:id', optionalAuth, warehouseController.getWarehouseById);

router.post('/warehouses', authenticate, requireAdminOrSeller, validate(createWarehouseSchema), warehouseController.createWarehouse);

router.put('/warehouses/:id', authenticate, requireAdminOrSeller, validate(updateWarehouseSchema), warehouseController.updateWarehouse);

router.delete('/warehouses/:id', authenticate, requireAdminOrSeller, warehouseController.deleteWarehouse);

export default router;
