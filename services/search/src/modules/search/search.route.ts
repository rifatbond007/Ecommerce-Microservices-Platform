import { Router } from 'express';
import { searchController } from './search.controller';
import { optionalAuth, authenticate } from '../../middleware';
import { validate, validateQuery } from '../../utils/validate';
import { searchQuerySchema, suggestionsQuerySchema, trendingQuerySchema, clickBodySchema } from './search.validator';

const router = Router();

/**
 * @swagger
 * /search/products:
 *   get:
 *     summary: Search products
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: category
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: brand
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by brand
 *       - in: query
 *         name: minPrice
 *         required: false
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         required: false
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: sort
 *         required: false
 *         schema:
 *           type: string
 *           enum: [price_asc, price_desc, newest, rating]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Search results
 *       400:
 *         description: Invalid query parameters
 */
router.get('/products', optionalAuth, validateQuery(searchQuerySchema), searchController.search);

/**
 * @swagger
 * /search/suggestions:
 *   get:
 *     summary: Get search suggestions
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Partial search query
 *     responses:
 *       200:
 *         description: List of search suggestions
 *       400:
 *         description: Invalid query parameters
 */
router.get('/suggestions', validateQuery(suggestionsQuerySchema), searchController.getSuggestions);

/**
 * @swagger
 * /search/trending:
 *   get:
 *     summary: Get trending searches
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of trending items to return
 *     responses:
 *       200:
 *         description: List of trending searches
 *       400:
 *         description: Invalid query parameters
 */
router.get('/trending', validateQuery(trendingQuerySchema), searchController.getTrending);

/**
 * @swagger
 * /search/click:
 *   post:
 *     summary: Log a search result click
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId]
 *             properties:
 *               productId:
 *                 type: string
 *                 description: The ID of the product that was clicked
 *     responses:
 *       200:
 *         description: Click logged successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/click', authenticate, validate(clickBodySchema), searchController.logClick);

export default router;
