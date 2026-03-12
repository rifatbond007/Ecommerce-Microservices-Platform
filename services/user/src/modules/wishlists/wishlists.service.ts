import { wishlistRepository } from '../../repositories';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateWishlistInput, UpdateWishlistInput, AddWishlistItemInput } from './wishlists.validator';

export interface WishlistItemResponse {
  id: string;
  productId: string;
  variantId: string | null;
  notes: string | null;
  priority: number;
  addedAt: Date;
}

export interface WishlistResponse {
  id: string;
  userId: string;
  name: string;
  isPublic: boolean;
  items: WishlistItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export class WishlistsService {
  async getWishlists(userId: string): Promise<WishlistResponse[]> {
    const wishlists = await wishlistRepository.findByUserId(userId);
    return wishlists.map(this.formatWishlistResponse);
  }

  async getWishlistById(id: string, userId: string): Promise<WishlistResponse> {
    const wishlist = await wishlistRepository.findById(id);

    if (!wishlist || wishlist.userId !== userId) {
      throw new NotFoundError('Wishlist');
    }

    return this.formatWishlistResponse(wishlist);
  }

  async createWishlist(userId: string, input: CreateWishlistInput): Promise<WishlistResponse> {
    const wishlist = await wishlistRepository.create({
      userId,
      name: input.name,
      isPublic: input.isPublic,
    });

    logger.info('Wishlist created', { userId, wishlistId: wishlist.id });

    return this.formatWishlistResponse(wishlist);
  }

  async updateWishlist(id: string, userId: string, input: UpdateWishlistInput): Promise<WishlistResponse> {
    const existing = await wishlistRepository.findById(id);

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Wishlist');
    }

    const wishlist = await wishlistRepository.update(id, input);

    logger.info('Wishlist updated', { userId, wishlistId: id });

    return this.formatWishlistResponse(wishlist);
  }

  async deleteWishlist(id: string, userId: string): Promise<void> {
    const existing = await wishlistRepository.findById(id);

    if (!existing || existing.userId !== userId) {
      throw new NotFoundError('Wishlist');
    }

    await wishlistRepository.delete(id);

    logger.info('Wishlist deleted', { userId, wishlistId: id });
  }

  async addItem(wishlistId: string, userId: string, input: AddWishlistItemInput): Promise<WishlistItemResponse> {
    const wishlist = await wishlistRepository.findById(wishlistId);

    if (!wishlist || wishlist.userId !== userId) {
      throw new NotFoundError('Wishlist');
    }

    const existingItem = await wishlistRepository.findItem(wishlistId, input.productId, input.variantId);

    if (existingItem) {
      throw new ConflictError('Item already in wishlist');
    }

    const item = await wishlistRepository.addItem({
      wishlistId,
      productId: input.productId,
      variantId: input.variantId,
      notes: input.notes,
      priority: input.priority,
    });

    logger.info('Item added to wishlist', { userId, wishlistId, productId: input.productId });

    return this.formatWishlistItemResponse(item);
  }

  async removeItem(wishlistId: string, productId: string, userId: string, variantId?: string): Promise<void> {
    const wishlist = await wishlistRepository.findById(wishlistId);

    if (!wishlist || wishlist.userId !== userId) {
      throw new NotFoundError('Wishlist');
    }

    await wishlistRepository.removeItem(wishlistId, productId, variantId);

    logger.info('Item removed from wishlist', { userId, wishlistId, productId });
  }

  private formatWishlistResponse(wishlist: any): WishlistResponse {
    return {
      id: wishlist.id,
      userId: wishlist.userId,
      name: wishlist.name,
      isPublic: wishlist.isPublic,
      items: wishlist.items.map((item: any) => this.formatWishlistItemResponse(item)),
      createdAt: wishlist.createdAt,
      updatedAt: wishlist.updatedAt,
    };
  }

  private formatWishlistItemResponse(item: any): WishlistItemResponse {
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      notes: item.notes,
      priority: item.priority,
      addedAt: item.addedAt,
    };
  }
}

export const wishlistsService = new WishlistsService();
