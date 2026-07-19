import { Router } from 'express';
import { addressesController } from './addresses.controller';
import { authenticate } from '../../middleware';
import { validate, validateParams } from '../../utils/validate';
import { createAddressSchema, updateAddressSchema, addressIdSchema } from './addresses.validator';

const router = Router();

/**
 * @swagger
 * /users/me/addresses:
 *   get:
 *     tags: [Addresses]
 *     summary: List user addresses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: List of addresses
 *       '401':
 *         description: Unauthorized
 */
router.get('/', authenticate, addressesController.getAddresses);

/**
 * @swagger
 * /users/me/addresses/{id}:
 *   get:
 *     tags: [Addresses]
 *     summary: Get address by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Address details
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Address not found
 */
router.get('/:id', authenticate, validateParams(addressIdSchema), addressesController.getAddressById);

/**
 * @swagger
 * /users/me/addresses:
 *   post:
 *     tags: [Addresses]
 *     summary: Create a new address
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, addressLine1, city, state, postalCode, country]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [shipping, billing]
 *               isDefault:
 *                 type: boolean
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *               phone:
 *                 type: string
 *               deliveryInstructions:
 *                 type: string
 *     responses:
 *       '201':
 *         description: Address created
 *       '401':
 *         description: Unauthorized
 *       '400':
 *         description: Validation error
 */
router.post('/', authenticate, validate(createAddressSchema), addressesController.createAddress);

/**
 * @swagger
 * /users/me/addresses/{id}:
 *   put:
 *     tags: [Addresses]
 *     summary: Update an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [shipping, billing]
 *               isDefault:
 *                 type: boolean
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               company:
 *                 type: string
 *                 nullable: true
 *               addressLine1:
 *                 type: string
 *               addressLine2:
 *                 type: string
 *                 nullable: true
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               country:
 *                 type: string
 *               phone:
 *                 type: string
 *                 nullable: true
 *               deliveryInstructions:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       '200':
 *         description: Address updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Address not found
 */
router.put('/:id', authenticate, validateParams(addressIdSchema), validate(updateAddressSchema), addressesController.updateAddress);

/**
 * @swagger
 * /users/me/addresses/{id}:
 *   delete:
 *     tags: [Addresses]
 *     summary: Delete an address
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Address deleted
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Address not found
 */
router.delete('/:id', authenticate, validateParams(addressIdSchema), addressesController.deleteAddress);

/**
 * @swagger
 * /users/me/addresses/{id}/default:
 *   post:
 *     tags: [Addresses]
 *     summary: Set address as default
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Default address updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Address not found
 */
router.post('/:id/default', authenticate, validateParams(addressIdSchema), addressesController.setDefaultAddress);

export default router;
