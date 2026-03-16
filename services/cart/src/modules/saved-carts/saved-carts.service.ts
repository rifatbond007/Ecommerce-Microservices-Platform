import { savedCartRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface SavedCartItem {
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
}

export interface SavedCartResponse {
  id: string;
  userId: string;
  name: string;
  items: SavedCartItem[];
  originalCartId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class SavedCartsService {
  private formatSavedCartResponse(cart: any): SavedCartResponse {
    return {
      id: cart.id,
      userId: cart.userId,
      name: cart.name,
      items: cart.items as SavedCartItem[],
      originalCartId: cart.originalCartId,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async getSavedCarts(userId: string): Promise<SavedCartResponse[]> {
    const carts = await savedCartRepository.findByUserId(userId);
    return carts.map((cart) => this.formatSavedCartResponse(cart));
  }

  async getSavedCartById(id: string, userId: string): Promise<SavedCartResponse> {
    const cart = await savedCartRepository.findById(id);
    if (!cart || cart.userId !== userId) {
      throw new NotFoundError('Saved cart');
    }
    return this.formatSavedCartResponse(cart);
  }

  async createSavedCart(userId: string, name: string, items: SavedCartItem[], originalCartId?: string): Promise<SavedCartResponse> {
    const cart = await savedCartRepository.create({
      userId,
      name,
      items,
      originalCartId,
    });
    logger.info('Saved cart created', { cartId: cart.id, userId });
    return this.formatSavedCartResponse(cart);
  }

  async updateSavedCart(id: string, userId: string, name: string, items: SavedCartItem[]): Promise<SavedCartResponse> {
    const cart = await savedCartRepository.findById(id);
    if (!cart || cart.userId !== userId) {
      throw new NotFoundError('Saved cart');
    }

    const updated = await savedCartRepository.update(id, { name, items });
    logger.info('Saved cart updated', { cartId: id });
    return this.formatSavedCartResponse(updated);
  }

  async deleteSavedCart(id: string, userId: string): Promise<void> {
    const cart = await savedCartRepository.findById(id);
    if (!cart || cart.userId !== userId) {
      throw new NotFoundError('Saved cart');
    }

    await savedCartRepository.delete(id);
    logger.info('Saved cart deleted', { cartId: id });
  }
}

export const savedCartsService = new SavedCartsService();
