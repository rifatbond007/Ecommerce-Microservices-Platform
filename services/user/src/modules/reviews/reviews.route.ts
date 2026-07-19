import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { authenticate, optionalAuth } from '../../middleware';
import { validate, validateParams, validateQuery } from '../../utils/validate';
import { createReviewSchema, updateReviewSchema, reviewIdSchema, productReviewsSchema } from './reviews.validator';

const router = Router();

/**
 * @swagger
 * /users/me/reviews/product/{productId}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get reviews for a product
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: page
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Product reviews
 *       '404':
 *         description: Product not found
 */
router.get('/product/:productId', optionalAuth, validateQuery(productReviewsSchema), reviewsController.getProductReviews);

/**
 * @swagger
 * /users/me/reviews/product/{productId}/rating:
 *   get:
 *     tags: [Reviews]
 *     summary: Get product rating summary
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Product rating summary
 */
router.get('/product/:productId/rating', reviewsController.getProductRating);

/**
 * @swagger
 * /users/me/reviews/my-reviews:
 *   get:
 *     tags: [Reviews]
 *     summary: Get current user's reviews
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       '200':
 *         description: User's reviews
 *       '401':
 *         description: Unauthorized
 */
router.get('/my-reviews', authenticate, reviewsController.getUserReviews);

/**
 * @swagger
 * /users/me/reviews/{id}:
 *   get:
 *     tags: [Reviews]
 *     summary: Get review by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       '200':
 *         description: Review details
 *       '404':
 *         description: Review not found
 */
router.get('/:id', optionalAuth, validateParams(reviewIdSchema), reviewsController.getReviewById);

/**
 * @swagger
 * /users/me/reviews:
 *   post:
 *     tags: [Reviews]
 *     summary: Create a review
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, rating, title, content]
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               orderId:
 *                 type: string
 *                 format: uuid
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       '201':
 *         description: Review created
 *       '400':
 *         description: Validation error
 *       '401':
 *         description: Unauthorized
 */
router.post('/', authenticate, validate(createReviewSchema), reviewsController.createReview);

/**
 * @swagger
 * /users/me/reviews/{id}:
 *   put:
 *     tags: [Reviews]
 *     summary: Update a review
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
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uri
 *     responses:
 *       '200':
 *         description: Review updated
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Review not found
 */
router.put('/:id', authenticate, validateParams(reviewIdSchema), validate(updateReviewSchema), reviewsController.updateReview);

/**
 * @swagger
 * /users/me/reviews/{id}:
 *   delete:
 *     tags: [Reviews]
 *     summary: Delete a review
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
 *         description: Review deleted
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Review not found
 */
router.delete('/:id', authenticate, validateParams(reviewIdSchema), reviewsController.deleteReview);

/**
 * @swagger
 * /users/me/reviews/{id}/helpful:
 *   post:
 *     tags: [Reviews]
 *     summary: Mark a review as helpful
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
 *         description: Review marked as helpful
 *       '401':
 *         description: Unauthorized
 *       '404':
 *         description: Review not found
 */
router.post('/:id/helpful', authenticate, validateParams(reviewIdSchema), reviewsController.markHelpful);

export default router;
