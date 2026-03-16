import prisma from './prisma.client';

export interface CreateCartData {
  sessionId?: string;
  userId?: string;
  currency?: string;
}

export interface UpdateCartData {
  currency?: string;
  subtotal?: number;
  taxTotal?: number;
  shippingTotal?: number;
  discountTotal?: number;
  total?: number;
  couponCode?: string;
}

export interface CreateCartItemData {
  cartId: string;
  productId: string;
  variantId?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface UpdateCartItemData {
  quantity?: number;
  unitPrice?: number;
  totalPrice?: number;
}

export class CartRepository {
  async findById(id: string) {
    return prisma.cart.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  async findBySessionId(sessionId: string) {
    return prisma.cart.findUnique({
      where: { sessionId },
      include: { items: true },
    });
  }

  async findByUserId(userId: string) {
    return prisma.cart.findFirst({
      where: { userId },
      include: { items: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOrCreate(data: CreateCartData) {
    let cart;
    if (data.sessionId) {
      cart = await this.findBySessionId(data.sessionId);
      if (!cart) {
        cart = await prisma.cart.create({
          data: { sessionId: data.sessionId, currency: data.currency || 'USD' },
          include: { items: true },
        });
      }
    } else if (data.userId) {
      cart = await this.findByUserId(data.userId);
      if (!cart) {
        cart = await prisma.cart.create({
          data: { userId: data.userId, currency: data.currency || 'USD' },
          include: { items: true },
        });
      }
    }
    return cart;
  }

  async create(data: CreateCartData) {
    return prisma.cart.create({
      data: {
        sessionId: data.sessionId,
        userId: data.userId,
        currency: data.currency || 'USD',
      },
      include: { items: true },
    });
  }

  async update(id: string, data: UpdateCartData) {
    return prisma.cart.update({
      where: { id },
      data: {
        ...data,
        subtotal: data.subtotal !== undefined ? data.subtotal : undefined,
        taxTotal: data.taxTotal !== undefined ? data.taxTotal : undefined,
        shippingTotal: data.shippingTotal !== undefined ? data.shippingTotal : undefined,
        discountTotal: data.discountTotal !== undefined ? data.discountTotal : undefined,
        total: data.total !== undefined ? data.total : undefined,
        couponCode: data.couponCode !== undefined ? data.couponCode : undefined,
      },
      include: { items: true },
    });
  }

  async delete(id: string) {
    await prisma.cart.delete({ where: { id } });
  }

  async clearItems(cartId: string) {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  }
}

export class CartItemRepository {
  async findById(id: string) {
    return prisma.cartItem.findUnique({ where: { id } });
  }

  async findByCartAndProduct(cartId: string, productId: string, variantId?: string) {
    return prisma.cartItem.findFirst({
      where: { cartId, productId, variantId: variantId || undefined },
    });
  }

  async create(data: CreateCartItemData) {
    return prisma.cartItem.create({ data });
  }

  async update(id: string, data: UpdateCartItemData) {
    return prisma.cartItem.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await prisma.cartItem.delete({ where: { id } });
  }

  async deleteByCartId(cartId: string) {
    await prisma.cartItem.deleteMany({ where: { cartId } });
  }
}

export const cartRepository = new CartRepository();
export const cartItemRepository = new CartItemRepository();
