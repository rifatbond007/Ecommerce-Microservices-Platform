import prisma from './prisma.client';

export interface CreateWishlistData {
  userId: string;
  name?: string;
  isPublic?: boolean;
}

export interface UpdateWishlistData {
  name?: string;
  isPublic?: boolean;
}

export interface AddWishlistItemData {
  wishlistId: string;
  productId: string;
  variantId?: string;
  notes?: string;
  priority?: number;
}

export class WishlistRepository {
  async findById(id: string) {
    return prisma.wishlist.findUnique({
      where: { id },
      include: {
        items: true,
      },
    });
  }

  async findByUserId(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserIdAndName(userId: string, name: string) {
    return prisma.wishlist.findFirst({
      where: { userId, name },
    });
  }

  async create(data: CreateWishlistData) {
    return prisma.wishlist.create({
      data: {
        userId: data.userId,
        name: data.name || 'My Wishlist',
        isPublic: data.isPublic || false,
      },
      include: {
        items: true,
      },
    });
  }

  async update(id: string, data: UpdateWishlistData) {
    return prisma.wishlist.update({
      where: { id },
      data,
      include: {
        items: true,
      },
    });
  }

  async delete(id: string) {
    return prisma.wishlist.delete({
      where: { id },
    });
  }

  async addItem(data: AddWishlistItemData) {
    return prisma.wishlistItem.create({
      data: {
        wishlistId: data.wishlistId,
        productId: data.productId,
        variantId: data.variantId,
        notes: data.notes,
        priority: data.priority || 0,
      },
    });
  }

  async removeItem(wishlistId: string, productId: string, variantId?: string) {
    return prisma.wishlistItem.delete({
      where: {
        wishlistId_productId_variantId: {
          wishlistId,
          productId,
          variantId: variantId || null,
        },
      },
    });
  }

  async findItem(wishlistId: string, productId: string, variantId?: string) {
    return prisma.wishlistItem.findUnique({
      where: {
        wishlistId_productId_variantId: {
          wishlistId,
          productId,
          variantId: variantId || null,
        },
      },
    });
  }
}

export const wishlistRepository = new WishlistRepository();
