import { Router } from 'express';
import { variantsController } from './variants.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createProductVariantSchema, updateProductVariantSchema } from './variants.validator';

const router = Router();

/**
 * @swagger
 * /variants/product/{productId}:
 *   get:
 *     tags: [Variants]
 *     summary: Get variants for a product
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: List of variants
 */
router.get('/product/:productId', optionalAuth, variantsController.getVariantsByProductId);

/**
 * @swagger
 * /variants/{id}:
 *   get:
 *     tags: [Variants]
 *     summary: Get variant by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Variant found
 *       404:
 *         description: Variant not found
 */
router.get('/:id', optionalAuth, variantsController.getVariantById);

/**
 * @swagger
 * /variants:
 *   post:
 *     tags: [Variants]
 *     summary: Create a variant
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, name, sku, price]
 *             properties:
 *               productId: { type: string }
 *               name: { type: string }
 *               sku: { type: string }
 *               price: { type: number }
 *               attributes: { type: object }
 *     responses:
 *       201:
 *         description: Variant created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, requireAdminOrSeller, validate(createProductVariantSchema), variantsController.createVariant);

/**
 * @swagger
 * /variants/{id}:
 *   put:
 *     tags: [Variants]
 *     summary: Update a variant
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
 *               sku: { type: string }
 *               price: { type: number }
 *               attributes: { type: object }
 *     responses:
 *       200:
 *         description: Variant updated
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Variant not found
 */
router.put('/:id', authenticate, requireAdminOrSeller, validate(updateProductVariantSchema), variantsController.updateVariant);

/**
 * @swagger
 * /variants/{id}:
 *   delete:
 *     tags: [Variants]
 *     summary: Delete a variant
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Variant deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Variant not found
 */
router.delete('/:id', authenticate, requireAdminOrSeller, variantsController.deleteVariant);

export default router;
