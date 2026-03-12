import { reviewRepository } from '../../repositories';
import { NotFoundError, ForbiddenError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateReviewInput, UpdateReviewInput } from './reviews.validator';

export interface ReviewResponse {
  id: string;
  userId: string;
  productId: string;
  orderId: string | null;
  rating: number;
  title: string;
  content: string;
  images: string[];
  isVerifiedPurchase: boolean;
  isApproved: boolean;
  helpfulCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedReviewsResponse {
  reviews: ReviewResponse[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class ReviewsService {
  async getProductReviews(productId: string, page: number = 1, limit: number = 10): Promise<PaginatedReviewsResponse> {
    const result = await reviewRepository.findByProductId(productId, page, limit);

    return {
      reviews: result.reviews.map(this.formatReviewResponse),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
  }

  async getUserReviews(userId: string): Promise<ReviewResponse[]> {
    const reviews = await reviewRepository.findByUserId(userId);
    return reviews.map(this.formatReviewResponse);
  }

  async getReviewById(id: string): Promise<ReviewResponse> {
    const review = await reviewRepository.findById(id);

    if (!review) {
      throw new NotFoundError('Review');
    }

    return this.formatReviewResponse(review);
  }

  async createReview(userId: string, input: CreateReviewInput): Promise<ReviewResponse> {
    if (input.orderId) {
      const existingReviews = await reviewRepository.findByOrderId(input.orderId);
      const productHasReview = existingReviews.some(r => r.productId === input.productId);
      
      if (productHasReview) {
        throw new ForbiddenError('You have already reviewed this product from this order');
      }
    }

    const review = await reviewRepository.create({
      userId,
      productId: input.productId,
      orderId: input.orderId,
      rating: input.rating,
      title: input.title,
      content: input.content,
      images: input.images,
      isVerifiedPurchase: !!input.orderId,
    });

    logger.info('Review created', { userId, reviewId: review.id, productId: input.productId });

    return this.formatReviewResponse(review);
  }

  async updateReview(id: string, userId: string, input: UpdateReviewInput): Promise<ReviewResponse> {
    const existing = await reviewRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Review');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('You can only update your own reviews');
    }

    const review = await reviewRepository.update(id, input);

    logger.info('Review updated', { userId, reviewId: id });

    return this.formatReviewResponse(review);
  }

  async deleteReview(id: string, userId: string): Promise<void> {
    const existing = await reviewRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Review');
    }

    if (existing.userId !== userId) {
      throw new ForbiddenError('You can only delete your own reviews');
    }

    await reviewRepository.delete(id);

    logger.info('Review deleted', { userId, reviewId: id });
  }

  async markHelpful(reviewId: string, userId: string): Promise<{ helpfulCount: number }> {
    const existing = await reviewRepository.findById(reviewId);

    if (!existing) {
      throw new NotFoundError('Review');
    }

    await reviewRepository.markHelpful(reviewId, userId);

    const updated = await reviewRepository.findById(reviewId);

    logger.info('Review marked helpful', { userId, reviewId });

    return { helpfulCount: updated!.helpfulCount };
  }

  async getProductRating(productId: string): Promise<{ averageRating: number; reviewCount: number }> {
    return reviewRepository.getProductRating(productId);
  }

  private formatReviewResponse(review: any): ReviewResponse {
    return {
      id: review.id,
      userId: review.userId,
      productId: review.productId,
      orderId: review.orderId,
      rating: review.rating,
      title: review.title,
      content: review.content,
      images: review.images,
      isVerifiedPurchase: review.isVerifiedPurchase,
      isApproved: review.isApproved,
      helpfulCount: review.helpfulCount,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }
}

export const reviewsService = new ReviewsService();
