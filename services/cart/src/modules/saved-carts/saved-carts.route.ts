import { Router } from 'express';
import { savedCartsController } from './saved-carts.controller';
import { authenticate } from '../../middleware';
import { validate } from '../../utils/validate';
import { createSavedCartSchema, updateSavedCartSchema, savedCartIdSchema } from './saved-carts.validator';

const router = Router();

/**
 * @swagger
 * /saved-carts:
 *   get:
 *     tags: [Saved Carts]
 *     summary: List saved carts
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved carts retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, savedCartsController.getSavedCarts);

/**
 * @swagger
 * /saved-carts/{id}:
 *   get:
 *     tags: [Saved Carts]
 *     summary: Get saved cart by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saved cart retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved cart not found
 */
router.get('/:id', authenticate, validate(savedCartIdSchema), savedCartsController.getSavedCartById);

/**
 * @swagger
 * /saved-carts:
 *   post:
 *     tags: [Saved Carts]
 *     summary: Create saved cart
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Saved cart created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(createSavedCartSchema), savedCartsController.createSavedCart);

/**
 * @swagger
 * /saved-carts/{id}/restore:
 *   post:
 *     tags: [Saved Carts]
 *     summary: Restore saved cart to active cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saved cart restored successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved cart not found
 */
router.post('/:id/restore', authenticate, validate(savedCartIdSchema), savedCartsController.restoreSavedCart);

/**
 * @swagger
 * /saved-carts/{id}:
 *   put:
 *     tags: [Saved Carts]
 *     summary: Update saved cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Saved cart updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved cart not found
 */
router.put('/:id', authenticate, validate(updateSavedCartSchema), savedCartsController.updateSavedCart);

/**
 * @swagger
 * /saved-carts/{id}:
 *   delete:
 *     tags: [Saved Carts]
 *     summary: Delete saved cart
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Saved cart deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved cart not found
 */
router.delete('/:id', authenticate, validate(savedCartIdSchema), savedCartsController.deleteSavedCart);

export default router;
