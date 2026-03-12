import prisma from './prisma.client';

export interface CreateReviewData {
  userId: string;
  productId: string;
  orderId?: string;
  rating: number;
  title: string;
  content: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
}

export interface UpdateReviewData {
  rating?: number;
  title?: string;
  content?: string;
  images?: string[];
  isApproved?: boolean;
}

export class ReviewRepository {
  async findById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      include: {
        helpfulVotes: true,
      },
    });
  }

  async findByProductId(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { productId, isApproved: true },
        include: {
          helpfulVotes: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: { productId, isApproved: true },
      }),
    ]);

    return { reviews, total, page, limit };
  }

  async findByUserId(userId: string) {
    return prisma.review.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByOrderId(orderId: string) {
    return prisma.review.findMany({
      where: { orderId },
    });
  }

  async create(data: CreateReviewData) {
    return prisma.review.create({
      data: {
        userId: data.userId,
        productId: data.productId,
        orderId: data.orderId,
        rating: data.rating,
        title: data.title,
        content: data.content,
        images: data.images || [],
        isVerifiedPurchase: data.isVerifiedPurchase || false,
      },
      include: {
        helpfulVotes: true,
      },
    });
  }

  async update(id: string, data: UpdateReviewData) {
    return prisma.review.update({
      where: { id },
      data,
      include: {
        helpfulVotes: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.review.delete({
      where: { id },
    });
  }

  async markHelpful(reviewId: string, userId: string) {
    const existing = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    if (existing) {
      await prisma.$transaction([
        prisma.reviewHelpful.delete({
          where: {
            reviewId_userId: {
              reviewId,
              userId,
            },
          },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ]);
      return null;
    }

    return prisma.$transaction([
      prisma.reviewHelpful.create({
        data: {
          reviewId,
          userId,
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: { helpfulCount: { increment: 1 } },
      }),
    ]);
  }

  async getProductRating(productId: string) {
    const result = await prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      averageRating: result._avg.rating || 0,
      reviewCount: result._count.rating || 0,
    };
  }
}

export const reviewRepository = new ReviewRepository();
