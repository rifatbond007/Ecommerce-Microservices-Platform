import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockFindById: jest.Mock = jest.fn();
const mockFindByOrderNumber: jest.Mock = jest.fn();
const mockFindByUserId: jest.Mock = jest.fn();
const mockCountByUserId: jest.Mock = jest.fn();
const mockCreate: jest.Mock = jest.fn();
const mockUpdate: jest.Mock = jest.fn();
const mockUpdateStatus: jest.Mock = jest.fn();
const mockAddStatusHistory: jest.Mock = jest.fn();
const mockCreateShipment: jest.Mock = jest.fn();
const mockCreateRefund: jest.Mock = jest.fn();
const mockCreateReturn: jest.Mock = jest.fn();
const mockUpdateReturn: jest.Mock = jest.fn();

jest.mock('../src/repositories/order.repository', () => ({
  orderRepository: {
    findById: mockFindById,
    findByOrderNumber: mockFindByOrderNumber,
    findByUserId: mockFindByUserId,
    countByUserId: mockCountByUserId,
    create: mockCreate,
    update: mockUpdate,
    updateStatus: mockUpdateStatus,
    addStatusHistory: mockAddStatusHistory,
    createShipment: mockCreateShipment,
    createRefund: mockCreateRefund,
    createReturn: mockCreateReturn,
    updateReturn: mockUpdateReturn,
  },
}));

jest.mock('../src/config', () => ({
  config: {
    cartService: { url: 'http://localhost:3004' },
    authService: { url: 'http://localhost:3001' },
    tax: { rate: 0.1 },
    interService: {
      secret: 'test-inter-service-secret',
      keyId: 'v1',
      clockSkewSeconds: 60,
    },
  },
}));

jest.mock('axios', () => ({
  get: jest.fn() as jest.Mock,
}));

describe('OrdersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getOrderById', () => {
    it('should return order by id successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'pending',
        items: [],
      };

      mockFindById.mockResolvedValue(mockOrder);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      const result = await ordersService.getOrderById('order-1', 'user-1');

      expect(result).toEqual(mockOrder);
      expect(mockFindById).toHaveBeenCalledWith('order-1');
    });

    it('should throw NotFoundError if order not found', async () => {
      mockFindById.mockRejectedValue(new Error('Order not found'));

      const { ordersService } = await import('../src/modules/orders/orders.service');
      
      await expect(ordersService.getOrderById('order-1', 'user-1')).rejects.toThrow();
    });

    it('should throw NotFoundError if user does not own order', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'pending',
      };

      mockFindById.mockResolvedValue(mockOrder);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      
      await expect(ordersService.getOrderById('order-1', 'user-2')).rejects.toThrow();
    });
  });

  describe('getOrderByNumber', () => {
    it('should return order by order number successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'pending',
      };

      mockFindByOrderNumber.mockResolvedValue(mockOrder);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      const result = await ordersService.getOrderByNumber('ORD-ABC123', 'user-1');

      expect(result).toEqual(mockOrder);
      expect(mockFindByOrderNumber).toHaveBeenCalledWith('ORD-ABC123');
    });
  });

  describe('getOrdersByUserId', () => {
    it('should return orders for user with pagination', async () => {
      const mockOrders = [
        { id: 'order-1', userId: 'user-1', status: 'pending' },
        { id: 'order-2', userId: 'user-1', status: 'delivered' },
      ];

      mockFindByUserId.mockResolvedValue(mockOrders);
      mockCountByUserId.mockResolvedValue(2);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      const result = await ordersService.getOrdersByUserId('user-1', 10, 0);

      expect(result.orders).toEqual(mockOrders);
      expect(result.total).toBe(2);
      expect(mockFindByUserId).toHaveBeenCalledWith('user-1', 10, 0);
    });
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const axios = await import('axios');
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            id: 'cart-1',
            items: [
              { productId: 'prod-1', variantId: null, quantity: 2, unitPrice: 50, totalPrice: 100 },
            ],
          },
        },
      });

      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'pending',
        subtotal: 100,
        taxTotal: 10,
        shippingTotal: 10,
        total: 120,
        items: [],
      };

      mockCreate.mockResolvedValue(mockOrder);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      const result = await ordersService.createOrder('user-1', {
        cartId: 'cart-1',
        shippingAddressId: 'addr-1',
        billingAddressId: 'addr-1',
      });

      expect(result).toEqual(mockOrder);
      expect(mockCreate).toHaveBeenCalled();
    });

    it('should throw ValidationError if cart is empty', async () => {
      const axios = await import('axios');
      (axios.get as jest.Mock).mockResolvedValue({
        data: {
          data: {
            id: 'cart-1',
            items: [],
          },
        },
      });

      const { ordersService } = await import('../src/modules/orders/orders.service');
      
      await expect(
        ordersService.createOrder('user-1', {
          cartId: 'cart-1',
          shippingAddressId: 'addr-1',
          billingAddressId: 'addr-1',
        })
      ).rejects.toThrow('Failed to create order');
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'pending',
      };

      mockFindById.mockResolvedValue(mockOrder);
      mockUpdateStatus.mockResolvedValue({ ...mockOrder, status: 'processing' });

      const { ordersService } = await import('../src/modules/orders/orders.service');
      const result = await ordersService.updateOrderStatus('order-1', 'user-1', {
        status: 'processing',
      });

      expect(result.status).toBe('processing');
    });

    it('should throw ValidationError for invalid status', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'pending',
      };

      mockFindById.mockResolvedValue(mockOrder);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      
      await expect(
        ordersService.updateOrderStatus('order-1', 'user-1', {
          status: 'invalid_status',
        })
      ).rejects.toThrow();
    });

    it('should throw ConflictError if order is cancelled', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'cancelled',
      };

      mockFindById.mockResolvedValue(mockOrder);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      
      await expect(
        ordersService.updateOrderStatus('order-1', 'user-1', {
          status: 'processing',
        })
      ).rejects.toThrow('Cannot update a cancelled order');
    });
  });

  describe('createReturn', () => {
    it('should create return successfully', async () => {
      const mockOrder = {
        id: 'order-1',
        orderNumber: 'ORD-ABC123',
        userId: 'user-1',
        status: 'delivered',
        items: [
          { id: 'item-1', productId: 'prod-1', quantity: 2 },
        ],
      };

      mockFindById.mockResolvedValue(mockOrder);
      mockCreateReturn.mockResolvedValue({
        id: 'return-1',
        orderId: 'order-1',
        orderItemId: 'item-1',
        quantity: 1,
        reason: 'Defective',
      });

      const { ordersService } = await import('../src/modules/orders/orders.service');
      const result = await ordersService.createReturn('order-1', 'user-1', {
        orderItemId: 'item-1',
        quantity: 1,
        reason: 'Defective',
      });

      expect(result).toBeDefined();
      expect(mockCreateReturn).toHaveBeenCalled();
    });

    it('should throw ValidationError if order not delivered', async () => {
      const mockOrder = {
        id: 'order-1',
        userId: 'user-1',
        status: 'pending',
        items: [],
      };

      mockFindById.mockResolvedValue(mockOrder);

      const { ordersService } = await import('../src/modules/orders/orders.service');
      
      await expect(
        ordersService.createReturn('order-1', 'user-1', {
          orderItemId: 'item-1',
          quantity: 1,
          reason: 'Defective',
        })
      ).rejects.toThrow('Can only return delivered orders');
    });
  });
});
