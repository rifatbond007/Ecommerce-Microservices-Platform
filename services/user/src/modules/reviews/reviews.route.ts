import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { authenticate, optionalAuth } from '../../middleware';
import { validate, validateParams, validateQuery } from '../../utils/validate';
import { createReviewSchema, updateReviewSchema, reviewIdSchema, productReviewsSchema } from './reviews.validator';

const router = Router();

router.get('/product/:productId', optionalAuth, validateQuery(productReviewsSchema), reviewsController.getProductReviews);

router.get('/product/:productId/rating', reviewsController.getProductRating);

router.get('/my-reviews', authenticate, reviewsController.getUserReviews);

router.get('/:id', optionalAuth, validateParams(reviewIdSchema), reviewsController.getReviewById);

router.post('/', authenticate, validate(createReviewSchema), reviewsController.createReview);

router.put('/:id', authenticate, validateParams(reviewIdSchema), validate(updateReviewSchema), reviewsController.updateReview);

router.delete('/:id', authenticate, validateParams(reviewIdSchema), reviewsController.deleteReview);

router.post('/:id/helpful', authenticate, validateParams(reviewIdSchema), reviewsController.markHelpful);

export default router;
