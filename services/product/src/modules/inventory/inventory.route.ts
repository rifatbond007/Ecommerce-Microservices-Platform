import { Router } from 'express';
import { inventoryController } from './inventory.controller';
import { warehouseController } from './inventory.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createInventorySchema, inventoryQuerySchema, createWarehouseSchema, updateWarehouseSchema } from './inventory.validator';

const router = Router();

/**
 * @swagger
 * /inventory:
 *   get:
 *     tags: [Inventory]
 *     summary: List inventory
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: productId
 *         schema: { type: string }
 *       - in: query
 *         name: variantId
 *         schema: { type: string }
 *       - in: query
 *         name: lowStock
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: List of inventory records
 */
router.get('/', optionalAuth, validate(inventoryQuerySchema), inventoryController.getInventories);

/**
 * @swagger
 * /inventory/product/{productId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get inventory by product
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Inventory records found
 */
router.get('/product/:productId', optionalAuth, inventoryController.getInventoryByProductId);

/**
 * @swagger
 * /inventory/variant/{variantId}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get inventory by variant
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: variantId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Inventory records found
 */
router.get('/variant/:variantId', optionalAuth, inventoryController.getInventoryByVariantId);

/**
 * @swagger
 * /inventory:
 *   post:
 *     tags: [Inventory]
 *     summary: Create inventory record
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, quantity]
 *             properties:
 *               productId: { type: string }
 *               variantId: { type: string }
 *               quantity: { type: integer }
 *               warehouseId: { type: string }
 *     responses:
 *       201:
 *         description: Inventory created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, requireAdminOrSeller, validate(createInventorySchema), inventoryController.createInventory);

/**
 * @swagger
 * /inventory/{id}/adjust:
 *   post:
 *     tags: [Inventory]
 *     summary: Adjust inventory quantity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer }
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Quantity adjusted
 *       400:
 *         description: Invalid quantity
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Inventory not found
 */
router.post('/:id/adjust', authenticate, requireAdminOrSeller, inventoryController.adjustQuantity);

/**
 * @swagger
 * /inventory/{id}/reserve:
 *   post:
 *     tags: [Inventory]
 *     summary: Reserve inventory quantity
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: Quantity reserved
 *       400:
 *         description: Insufficient stock
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Inventory not found
 */
router.post('/:id/reserve', authenticate, requireAdminOrSeller, inventoryController.reserveQuantity);

/**
 * @swagger
 * /inventory/{id}/release:
 *   post:
 *     tags: [Inventory]
 *     summary: Release inventory reservation
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [quantity]
 *             properties:
 *               quantity: { type: integer }
 *     responses:
 *       200:
 *         description: Reservation released
 *       400:
 *         description: Invalid quantity
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Inventory not found
 */
router.post('/:id/release', authenticate, requireAdminOrSeller, inventoryController.releaseReservation);

/**
 * @swagger
 * /inventory/{id}:
 *   delete:
 *     tags: [Inventory]
 *     summary: Delete inventory record
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Inventory deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Inventory not found
 */
router.delete('/:id', authenticate, requireAdminOrSeller, inventoryController.deleteInventory);

/**
 * @swagger
 * /inventory/warehouses/all:
 *   get:
 *     tags: [Inventory]
 *     summary: List warehouses
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of warehouses
 */
router.get('/warehouses/all', optionalAuth, warehouseController.getWarehouses);

/**
 * @swagger
 * /inventory/warehouses/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get warehouse by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Warehouse found
 *       404:
 *         description: Warehouse not found
 */
router.get('/warehouses/:id', optionalAuth, warehouseController.getWarehouseById);

/**
 * @swagger
 * /inventory/warehouses:
 *   post:
 *     tags: [Inventory]
 *     summary: Create a warehouse
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *     responses:
 *       201:
 *         description: Warehouse created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post('/warehouses', authenticate, requireAdminOrSeller, validate(createWarehouseSchema), warehouseController.createWarehouse);

/**
 * @swagger
 * /inventory/warehouses/{id}:
 *   put:
 *     tags: [Inventory]
 *     summary: Update a warehouse
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               address: { type: string }
 *     responses:
 *       200:
 *         description: Warehouse updated
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Warehouse not found
 */
router.put('/warehouses/:id', authenticate, requireAdminOrSeller, validate(updateWarehouseSchema), warehouseController.updateWarehouse);

/**
 * @swagger
 * /inventory/warehouses/{id}:
 *   delete:
 *     tags: [Inventory]
 *     summary: Delete a warehouse
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Warehouse deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Warehouse not found
 */
router.delete('/warehouses/:id', authenticate, requireAdminOrSeller, warehouseController.deleteWarehouse);

/**
 * @swagger
 * /inventory/{id}:
 *   get:
 *     tags: [Inventory]
 *     summary: Get inventory by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Inventory record found
 *       404:
 *         description: Inventory not found
 */
// NOTE: this catch-all `/:id` GET must come AFTER all literal-path routes
// (e.g. `/warehouses/all`, `/warehouses/:id`) so that Express does not
// match `/warehouses/all` against the `/:id` parameter first.
router.get('/:id', optionalAuth, inventoryController.getInventoryById);

export default router;
