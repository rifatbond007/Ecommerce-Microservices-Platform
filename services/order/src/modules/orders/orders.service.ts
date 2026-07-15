import axios from 'axios';
import { config } from '../../config';
import { orderRepository } from '../../repositories';
import { NotFoundError, ValidationError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateOrderInput, UpdateOrderStatusInput, CreateReturnInput } from './orders.types';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export class OrdersService {
  private generateOrderNumber(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async getOrderById(orderId: string, userId: string) {
    const order = await orderRepository.findById(orderId);
    
    if (order.userId !== userId) {
      throw new NotFoundError('Order');
    }
    
    return order;
  }

  async getOrderByNumber(orderNumber: string, userId: string) {
    const order = await orderRepository.findByOrderNumber(orderNumber);
    
    if (order.userId !== userId) {
      throw new NotFoundError('Order');
    }
    
    return order;
  }

  async getOrdersByUser(userId: string, limit = 10, offset = 0) {
    return orderRepository.findByUserId(userId, limit, offset);
  }

  async createOrder(userId: string, input: CreateOrderInput) {
    try {
      const cartResponse = await axios.get(`${config.cartService.url}/api/v1/carts/${input.cartId}`, {
        headers: { 'x-user-id': userId },
      });

      const cart = cartResponse.data.data;

      if (!cart || !cart.items || cart.items.length === 0) {
        throw new ValidationError('Cart is empty');
      }

      const items = cart.items.map((item: any) => ({
        productId: item.productId,
        variantId: item.variantId || undefined,
        sku: item.productId.substring(0, 8),
        name: `Product ${item.productId.substring(0, 8)}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        taxAmount: 0,
        discountAmount: 0,
      }));

      const subtotal = items.reduce((sum: number, item: any) => sum + Number(item.totalPrice), 0);
      const taxTotal = subtotal * config.tax.rate;
      const shippingTotal = input.shippingMethod ? 10 : 0;
      const total = subtotal + taxTotal + shippingTotal;

      const order = await orderRepository.create({
        orderNumber: this.generateOrderNumber(),
        userId,
        cartId: input.cartId,
        status: 'pending',
        fulfillmentStatus: 'unfulfilled',
        financialStatus: 'pending',
        currency: 'USD',
        subtotal,
        taxTotal,
        shippingTotal,
        discountTotal: 0,
        total,
        shippingAddressId: input.shippingAddressId,
        billingAddressId: input.billingAddressId,
        shippingMethod: input.shippingMethod || null,
        notes: input.notes || null,
        items: {
          create: items,
        },
        statusHistory: {
          create: {
            status: '',
            newStatus: 'pending',
            note: 'Order created',
          },
        },
      });

      logger.info('Order created', { orderId: order.id, orderNumber: order.orderNumber, userId });

      return order;
    } catch (error: any) {
      if (error instanceof ValidationError || error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Failed to create order', { error: error.message, userId });
      throw new ValidationError('Failed to create order');
    }
  }

  async updateOrderStatus(orderId: string, userId: string, input: UpdateOrderStatusInput) {
    const order = await orderRepository.findById(orderId);

    if (order.userId !== userId && userId !== 'admin') {
      throw new NotFoundError('Order');
    }

    if (!ORDER_STATUSES.includes(input.status)) {
      throw new ValidationError(`Invalid status. Must be one of: ${ORDER_STATUSES.join(', ')}`);
    }

    if (order.status === 'cancelled' && input.status !== 'cancelled') {
      throw new ConflictError('Cannot update a cancelled order');
    }

    const updatedOrder = await orderRepository.updateStatus(orderId, input.status, userId);

    logger.info('Order status updated', { 
      orderId, 
      orderNumber: order.orderNumber, 
      newStatus: input.status 
    });

    return updatedOrder;
  }

  async createReturn(orderId: string, userId: string, input: CreateReturnInput) {
    const order = await orderRepository.findById(orderId);

    if (order.userId !== userId) {
      throw new NotFoundError('Order');
    }

    if (order.status !== 'delivered') {
      throw new ValidationError('Can only return delivered orders');
    }

    const orderItem = order.items.find((item) => item.id === input.orderItemId);
    if (!orderItem) {
      throw new NotFoundError('Order item');
    }

    if (input.quantity > orderItem.quantity) {
      throw new ValidationError('Return quantity exceeds ordered quantity');
    }

    const returnRecord = await orderRepository.createReturn(
      orderId,
      input.orderItemId,
      input.quantity,
      input.reason
    );

    logger.info('Return created', { orderId, returnId: returnRecord.id });

    return returnRecord;
  }

  async getOrdersByUserId(userId: string, limit: number, offset: number) {
    const orders = await orderRepository.findByUserId(userId, limit, offset);
    const total = await orderRepository.countByUserId(userId);
    
    return { orders, total };
  }
}

export const ordersService = new OrdersService();
