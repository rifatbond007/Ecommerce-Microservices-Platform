import { cartRepository, cartItemRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';

export interface CartItemResponse {
  id: string;
  cartId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartResponse {
  id: string;
  sessionId: string | null;
  userId: string | null;
  currency: string;
  subtotal: number;
  taxTotal: number;
  shippingTotal: number;
  discountTotal: number;
  total: number;
  couponCode: string | null;
  items: CartItemResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export class CartsService {
  private formatCartResponse(cart: any): CartResponse {
    return {
      id: cart.id,
      sessionId: cart.sessionId,
      userId: cart.userId,
      currency: cart.currency,
      subtotal: Number(cart.subtotal),
      taxTotal: Number(cart.taxTotal),
      shippingTotal: Number(cart.shippingTotal),
      discountTotal: Number(cart.discountTotal),
      total: Number(cart.total),
      couponCode: cart.couponCode,
      items: cart.items.map((item: any) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      })),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async getCart(sessionId?: string, userId?: string): Promise<CartResponse> {
    const cart = sessionId 
      ? await cartRepository.findBySessionId(sessionId)
      : userId 
        ? await cartRepository.findByUserId(userId)
        : null;

    if (!cart) {
      throw new NotFoundError('Cart');
    }

    return this.formatCartResponse(cart);
  }

  async getOrCreateCart(sessionId?: string, userId?: string): Promise<CartResponse> {
    const cart = await cartRepository.findOrCreate({ sessionId, userId });
    return this.formatCartResponse(cart);
  }

  async addItem(
    cartId: string,
    productId: string,
    variantId: string | undefined,
    quantity: number,
    unitPrice: number
  ): Promise<CartResponse> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    const existingItem = await cartItemRepository.findByCartAndProduct(cartId, productId, variantId);

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const newTotalPrice = newQuantity * unitPrice;
      await cartItemRepository.update(existingItem.id, {
        quantity: newQuantity,
        unitPrice,
        totalPrice: newTotalPrice,
      });
    } else {
      await cartItemRepository.create({
        cartId,
        productId,
        variantId,
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      });
    }

    await this.recalculateCart(cartId);
    const updatedCart = await cartRepository.findById(cartId);
    logger.info('Item added to cart', { cartId, productId, quantity });
    return this.formatCartResponse(updatedCart);
  }

  async updateItem(
    cartId: string,
    itemId: string,
    quantity: number,
    unitPrice: number
  ): Promise<CartResponse> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    const item = await cartItemRepository.findById(itemId);
    if (!item || item.cartId !== cartId) {
      throw new NotFoundError('Cart item');
    }

    if (quantity <= 0) {
      await cartItemRepository.delete(itemId);
    } else {
      await cartItemRepository.update(itemId, {
        quantity,
        unitPrice,
        totalPrice: quantity * unitPrice,
      });
    }

    await this.recalculateCart(cartId);
    const updatedCart = await cartRepository.findById(cartId);
    logger.info('Cart item updated', { cartId, itemId, quantity });
    return this.formatCartResponse(updatedCart);
  }

  async removeItem(cartId: string, itemId: string): Promise<CartResponse> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    const item = await cartItemRepository.findById(itemId);
    if (!item || item.cartId !== cartId) {
      throw new NotFoundError('Cart item');
    }

    await cartItemRepository.delete(itemId);
    await this.recalculateCart(cartId);
    const updatedCart = await cartRepository.findById(cartId);
    logger.info('Cart item removed', { cartId, itemId });
    return this.formatCartResponse(updatedCart);
  }

  async clearCart(cartId: string): Promise<CartResponse> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    await cartRepository.clearItems(cartId);
    await cartRepository.update(cartId, {
      subtotal: 0,
      taxTotal: 0,
      shippingTotal: 0,
      discountTotal: 0,
      total: 0,
    });

    const updatedCart = await cartRepository.findById(cartId);
    logger.info('Cart cleared', { cartId });
    return this.formatCartResponse(updatedCart);
  }

  async applyCoupon(cartId: string, couponCode: string): Promise<CartResponse> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    await cartRepository.update(cartId, { couponCode });
    const updatedCart = await cartRepository.findById(cartId);
    logger.info('Coupon applied', { cartId, couponCode });
    return this.formatCartResponse(updatedCart);
  }

  async removeCoupon(cartId: string): Promise<CartResponse> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    await cartRepository.update(cartId, { couponCode: undefined });
    const updatedCart = await cartRepository.findById(cartId);
    logger.info('Coupon removed', { cartId });
    return this.formatCartResponse(updatedCart);
  }

  async deleteCart(cartId: string): Promise<void> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) {
      throw new NotFoundError('Cart');
    }

    await cartRepository.delete(cartId);
    logger.info('Cart deleted', { cartId });
  }

  private async recalculateCart(cartId: string): Promise<void> {
    const cart = await cartRepository.findById(cartId);
    if (!cart) return;

    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
    const taxTotal = subtotal * 0.1;
    const total = subtotal + taxTotal + Number(cart.shippingTotal) - Number(cart.discountTotal);

    await cartRepository.update(cartId, {
      subtotal,
      taxTotal,
      total,
    });
  }
}

export const cartsService = new CartsService();
