import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockFindById = jest.fn();
const mockFindBySessionId = jest.fn();
const mockFindByUserId = jest.fn();
const mockFindOrCreate = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockClearItems = jest.fn();

const mockCartItemFindById = jest.fn();
const mockCartItemFindByCartAndProduct = jest.fn();
const mockCartItemCreate = jest.fn();
const mockCartItemUpdate = jest.fn();
const mockCartItemDelete = jest.fn();



jest.mock('../src/repositories', () => ({
  cartRepository: {
    findById: mockFindById,
    findBySessionId: mockFindBySessionId,
    findByUserId: mockFindByUserId,
    findOrCreate: mockFindOrCreate,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
    clearItems: mockClearItems,
  },
  cartItemRepository: {
    findById: mockCartItemFindById,
    findByCartAndProduct: mockCartItemFindByCartAndProduct,
    create: mockCartItemCreate,
    update: mockCartItemUpdate,
    delete: mockCartItemDelete,
  },
}));

jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

const mockCart = {
  id: 'cart-id-1',
  sessionId: 'session-1',
  userId: null,
  currency: 'USD',
  subtotal: 100.00,
  taxTotal: 10.00,
  shippingTotal: 0,
  discountTotal: 0,
  total: 110.00,
  couponCode: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  items: [],
};

const mockCartWithItems = {
  ...mockCart,
  items: [
    {
      id: 'item-1',
      cartId: 'cart-id-1',
      productId: 'product-1',
      variantId: null,
      quantity: 2,
      unitPrice: 50.00,
      totalPrice: 100.00,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
  ],
};

describe('CartsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return cart by sessionId', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindBySessionId.mockResolvedValue(mockCartWithItems);

      const result = await cartsService.getCart('session-1', undefined);

      expect(result.id).toBe('cart-id-1');
      expect(result.sessionId).toBe('session-1');
      expect(mockFindBySessionId).toHaveBeenCalledWith('session-1');
    });

    it('should return cart by userId', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindByUserId.mockResolvedValue({ ...mockCartWithItems, userId: 'user-1' });

      const result = await cartsService.getCart(undefined, 'user-1');

      expect(result.id).toBe('cart-id-1');
      expect(result.userId).toBe('user-1');
      expect(mockFindByUserId).toHaveBeenCalledWith('user-1');
    });

    it('should throw NotFoundError if cart not found', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindBySessionId.mockResolvedValue(null);

      await expect(cartsService.getCart('nonexistent-session', undefined))
        .rejects.toThrow('Cart not found');
    });

    it('should throw NotFoundError if neither sessionId nor userId provided', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');

      await expect(cartsService.getCart(undefined, undefined))
        .rejects.toThrow('Cart not found');
    });
  });

  describe('getOrCreateCart', () => {
    it('should create new cart with sessionId', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindOrCreate.mockResolvedValue(mockCart);

      const result = await cartsService.getOrCreateCart('new-session', undefined);

      expect(result.id).toBe('cart-id-1');
      expect(mockFindOrCreate).toHaveBeenCalledWith({ sessionId: 'new-session', userId: undefined });
    });

    it('should create new cart with userId', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindOrCreate.mockResolvedValue(mockCart);

      const result = await cartsService.getOrCreateCart(undefined, 'user-1');

      expect(result.id).toBe('cart-id-1');
      expect(mockFindOrCreate).toHaveBeenCalledWith({ sessionId: undefined, userId: 'user-1' });
    });
  });

  describe('addItem', () => {
    it('should add new item to cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById
        .mockResolvedValueOnce(mockCart)  // first call in addItem
        .mockResolvedValueOnce(mockCart)  // second call in recalculateCart
        .mockResolvedValueOnce({         // third call after recalculate
          ...mockCartWithItems,
          subtotal: 150.00,
          taxTotal: 15.00,
          total: 165.00,
        });
      mockCartItemFindByCartAndProduct.mockResolvedValue(null);
      mockCartItemCreate.mockResolvedValue({ id: 'new-item', productId: 'product-1' });

      const result = await cartsService.addItem('cart-id-1', 'product-1', undefined, 1, 50.00);

      expect(result.items).toHaveLength(1);
      expect(mockCartItemCreate).toHaveBeenCalledWith({
        cartId: 'cart-id-1',
        productId: 'product-1',
        variantId: undefined,
        quantity: 1,
        unitPrice: 50.00,
        totalPrice: 50.00,
      });
    });

    it('should update existing item quantity if product already in cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(mockCartWithItems);
      mockCartItemFindByCartAndProduct.mockResolvedValue({
        id: 'item-1',
        cartId: 'cart-id-1',
        productId: 'product-1',
        quantity: 2,
        unitPrice: 50.00,
      });
      mockCartItemUpdate.mockResolvedValue({ id: 'item-1' });
      mockFindById.mockResolvedValueOnce({
        ...mockCartWithItems,
        items: [{ ...mockCartWithItems.items[0], quantity: 3, totalPrice: 150.00 }],
      });

      const result = await cartsService.addItem('cart-id-1', 'product-1', undefined, 1, 50.00);

      expect(mockCartItemUpdate).toHaveBeenCalledWith('item-1', {
        quantity: 3,
        unitPrice: 50.00,
        totalPrice: 150.00,
      });
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(null);

      await expect(cartsService.addItem('nonexistent', 'product-1', undefined, 1, 50.00))
        .rejects.toThrow('Cart not found');
    });
  });

  describe('updateItem', () => {
    it('should update item quantity', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(mockCartWithItems);
      mockCartItemFindById.mockResolvedValue(mockCartWithItems.items[0]);
      mockCartItemUpdate.mockResolvedValue({ id: 'item-1' });
      mockFindById.mockResolvedValueOnce({
        ...mockCartWithItems,
        items: [{ ...mockCartWithItems.items[0], quantity: 5 }],
      });

      const result = await cartsService.updateItem('cart-id-1', 'item-1', 5, 50.00);

      expect(mockCartItemUpdate).toHaveBeenCalledWith('item-1', {
        quantity: 5,
        unitPrice: 50.00,
        totalPrice: 250.00,
      });
    });

    it('should delete item if quantity is 0', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(mockCartWithItems);
      mockCartItemFindById.mockResolvedValue(mockCartWithItems.items[0]);
      mockCartItemDelete.mockResolvedValue(undefined);
      mockFindById.mockResolvedValueOnce({ ...mockCartWithItems, items: [] });

      await cartsService.updateItem('cart-id-1', 'item-1', 0, 50.00);

      expect(mockCartItemDelete).toHaveBeenCalledWith('item-1');
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(null);

      await expect(cartsService.updateItem('nonexistent', 'item-1', 5, 50.00))
        .rejects.toThrow('Cart not found');
    });

    it('should throw NotFoundError if item does not belong to cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(mockCartWithItems);
      mockCartItemFindById.mockResolvedValue({ ...mockCartWithItems.items[0], cartId: 'different-cart' });

      await expect(cartsService.updateItem('cart-id-1', 'item-1', 5, 50.00))
        .rejects.toThrow('Cart item not found');
    });
  });

  describe('removeItem', () => {
    it('should remove item from cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById
        .mockResolvedValueOnce(mockCartWithItems)  // first call in removeItem
        .mockResolvedValueOnce(mockCartWithItems)  // second call in recalculateCart
        .mockResolvedValueOnce({ ...mockCartWithItems, items: [] });  // third call after recalculate
      mockCartItemFindById.mockResolvedValue(mockCartWithItems.items[0]);
      mockCartItemDelete.mockResolvedValue(undefined);

      const result = await cartsService.removeItem('cart-id-1', 'item-1');

      expect(mockCartItemDelete).toHaveBeenCalledWith('item-1');
      expect(result.items).toHaveLength(0);
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(null);

      await expect(cartsService.removeItem('nonexistent', 'item-1'))
        .rejects.toThrow('Cart not found');
    });

    it('should throw NotFoundError if item does not belong to cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(mockCartWithItems);
      mockCartItemFindById.mockResolvedValue({ ...mockCartWithItems.items[0], cartId: 'different-cart' });

      await expect(cartsService.removeItem('cart-id-1', 'item-1'))
        .rejects.toThrow('Cart item not found');
    });
  });

  describe('clearCart', () => {
    it('should clear all items from cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById
        .mockResolvedValueOnce(mockCartWithItems)
        .mockResolvedValueOnce({ ...mockCart, items: [], subtotal: 0, taxTotal: 0, total: 0 });
      mockClearItems.mockResolvedValue(undefined);
      mockUpdate.mockResolvedValue({ ...mockCart, subtotal: 0, taxTotal: 0, total: 0 });

      const result = await cartsService.clearCart('cart-id-1');

      expect(mockClearItems).toHaveBeenCalledWith('cart-id-1');
      expect(result.items).toHaveLength(0);
      expect(result.total).toBe(0);
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(null);

      await expect(cartsService.clearCart('nonexistent'))
        .rejects.toThrow('Cart not found');
    });
  });

  describe('applyCoupon', () => {
    it('should apply coupon code to cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById
        .mockResolvedValueOnce(mockCart)
        .mockResolvedValueOnce({ ...mockCart, couponCode: 'SAVE10' });
      mockUpdate.mockResolvedValue({ ...mockCart, couponCode: 'SAVE10' });

      const result = await cartsService.applyCoupon('cart-id-1', 'SAVE10');

      expect(mockUpdate).toHaveBeenCalledWith('cart-id-1', { couponCode: 'SAVE10' });
      expect(result.couponCode).toBe('SAVE10');
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(null);

      await expect(cartsService.applyCoupon('nonexistent', 'SAVE10'))
        .rejects.toThrow('Cart not found');
    });
  });

  describe('removeCoupon', () => {
    it('should remove coupon from cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById
        .mockResolvedValueOnce({ ...mockCart, couponCode: 'SAVE10' })
        .mockResolvedValueOnce({ ...mockCart, couponCode: null });
      mockUpdate.mockResolvedValue({ ...mockCart, couponCode: null });

      const result = await cartsService.removeCoupon('cart-id-1');

      expect(mockUpdate).toHaveBeenCalledWith('cart-id-1', { couponCode: undefined });
      expect(result.couponCode).toBeNull();
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(null);

      await expect(cartsService.removeCoupon('nonexistent'))
        .rejects.toThrow('Cart not found');
    });
  });

  describe('deleteCart', () => {
    it('should delete entire cart', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(mockCart);
      mockDelete.mockResolvedValue(undefined);

      await expect(cartsService.deleteCart('cart-id-1')).resolves.not.toThrow();
      expect(mockDelete).toHaveBeenCalledWith('cart-id-1');
    });

    it('should throw NotFoundError if cart does not exist', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      mockFindById.mockResolvedValue(null);

      await expect(cartsService.deleteCart('nonexistent'))
        .rejects.toThrow('Cart not found');
    });
  });

  describe('recalculateCart (tested via addItem)', () => {
    it('should recalculate cart totals when adding item', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      const cartWithItems = {
        ...mockCart,
        items: [
          { id: 'item-1', totalPrice: 100.00 },
          { id: 'item-2', totalPrice: 50.00 },
        ],
        shippingTotal: 10.00,
        discountTotal: 5.00,
      };
      
      mockFindById
        .mockResolvedValueOnce(cartWithItems)  // first call in addItem
        .mockResolvedValueOnce(cartWithItems)   // second call in recalculateCart
        .mockResolvedValueOnce(cartWithItems); // third call after recalculate
      mockCartItemFindByCartAndProduct.mockResolvedValue(null);
      mockCartItemCreate.mockResolvedValue({ id: 'new-item' });

      await cartsService.addItem('cart-id-1', 'new-product', undefined, 1, 25.00);

      expect(mockUpdate).toHaveBeenCalled();
    });
  });

  describe('ISSUE: Hardcoded tax rate (tested via addItem)', () => {
    it('should use 10% tax rate (ISSUE: hardcoded)', async () => {
      const { cartsService } = await import('../src/modules/carts/carts.service');
      
      const cartWithNewItem = { 
        ...mockCart, 
        items: [{ id: 'item-1', totalPrice: 100.00 }],
        shippingTotal: 0,
        discountTotal: 0,
      };
      
      mockFindById
        .mockResolvedValueOnce(mockCart)  // first call in addItem (empty cart)
        .mockResolvedValueOnce(cartWithNewItem)  // second call in recalculateCart (cart with item)
        .mockResolvedValueOnce(cartWithNewItem); // third call after recalculate
      mockCartItemFindByCartAndProduct.mockResolvedValue(null);
      mockCartItemCreate.mockResolvedValue({ id: 'item-1' });

      await cartsService.addItem('cart-id-1', 'product-1', undefined, 1, 100.00);

      expect(mockUpdate).toHaveBeenCalledWith(
        'cart-id-1',
        expect.objectContaining({ taxTotal: 10.00 })
      );
    });
  });
});
