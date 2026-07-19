import { Router } from 'express';
import { brandsController } from './brands.controller';
import { authenticate, requireAdminOrSeller, optionalAuth } from '../../middleware';
import { validate } from '../../utils/validate';
import { createBrandSchema, updateBrandSchema } from './brands.validator';

const router = Router();

/**
 * @swagger
 * /brands:
 *   get:
 *     tags: [Brands]
 *     summary: List brands
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of brands
 */
router.get('/', optionalAuth, brandsController.getBrands);

/**
 * @swagger
 * /brands/slug/{slug}:
 *   get:
 *     tags: [Brands]
 *     summary: Get brand by slug
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brand found
 *       404:
 *         description: Brand not found
 */
router.get('/slug/:slug', optionalAuth, brandsController.getBrandBySlug);

/**
 * @swagger
 * /brands/{id}:
 *   get:
 *     tags: [Brands]
 *     summary: Get brand by ID
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brand found
 *       404:
 *         description: Brand not found
 */
router.get('/:id', optionalAuth, brandsController.getBrandById);

/**
 * @swagger
 * /brands:
 *   post:
 *     tags: [Brands]
 *     summary: Create a brand
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
 *               description: { type: string }
 *               logo: { type: string }
 *     responses:
 *       201:
 *         description: Brand created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
router.post('/', authenticate, requireAdminOrSeller, validate(createBrandSchema), brandsController.createBrand);

/**
 * @swagger
 * /brands/{id}:
 *   put:
 *     tags: [Brands]
 *     summary: Update a brand
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
 *               description: { type: string }
 *               logo: { type: string }
 *     responses:
 *       200:
 *         description: Brand updated
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Brand not found
 */
router.put('/:id', authenticate, requireAdminOrSeller, validate(updateBrandSchema), brandsController.updateBrand);

/**
 * @swagger
 * /brands/{id}:
 *   delete:
 *     tags: [Brands]
 *     summary: Delete a brand
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Brand deleted
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Brand not found
 */
router.delete('/:id', authenticate, requireAdminOrSeller, brandsController.deleteBrand);

export default router;
