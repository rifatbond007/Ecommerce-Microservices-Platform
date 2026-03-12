import { Response, NextFunction } from 'express';
import { reviewsService } from './reviews.service';
import { AuthenticatedRequest } from '../../middleware';

export class ReviewsController {
  async getProductReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await reviewsService.getProductReviews(productId, page, limit);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserReviews(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const reviews = await reviewsService.getUserReviews(userId);

      res.status(200).json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      next(error);
    }
  }

  async getReviewById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const review = await reviewsService.getReviewById(id);

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async createReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const review = await reviewsService.createReview(userId, req.body);

      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const review = await reviewsService.updateReview(id, userId, req.body);

      res.status(200).json({
        success: true,
        data: review,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteReview(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      await reviewsService.deleteReview(id, userId);

      res.status(200).json({
        success: true,
        message: 'Review deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async markHelpful(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.userId;
      const { id } = req.params;
      const result = await reviewsService.markHelpful(id, userId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductRating(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { productId } = req.params;
      const rating = await reviewsService.getProductRating(productId);

      res.status(200).json({
        success: true,
        data: rating,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const reviewsController = new ReviewsController();
