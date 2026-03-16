import prisma from './prisma.client';

export interface CreateInventoryData {
  productId: string;
  variantId?: string;
  warehouseId: string;
  quantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
}

export interface UpdateInventoryData {
  quantity?: number;
  reservedQuantity?: number;
  reorderPoint?: number;
  reorderQuantity?: number;
  lastRestockedAt?: Date;
}

export class InventoryRepository {
  async findById(id: string) {
    return prisma.inventory.findUnique({
      where: { id },
      include: {
        product: true,
        variant: true,
        warehouse: true,
      },
    });
  }

  async findByProductId(productId: string) {
    return prisma.inventory.findMany({
      where: { productId },
      include: {
        variant: true,
        warehouse: true,
      },
    });
  }

  async findByVariantId(variantId: string) {
    return prisma.inventory.findFirst({
      where: { variantId },
      include: {
        product: true,
        warehouse: true,
      },
    });
  }

  async findByProductAndWarehouse(productId: string, warehouseId: string) {
    return prisma.inventory.findFirst({
      where: { productId, warehouseId },
      include: {
        product: true,
        variant: true,
        warehouse: true,
      },
    });
  }

  async findLowStock(threshold: number = 10) {
    return prisma.inventory.findMany({
      where: {
        quantity: { lte: threshold },
      },
      include: {
        product: true,
        variant: true,
        warehouse: true,
      },
      orderBy: { quantity: 'asc' },
    });
  }

  async findOutOfStock() {
    return prisma.inventory.findMany({
      where: {
        quantity: { lte: 0 },
      },
      include: {
        product: true,
        variant: true,
        warehouse: true,
      },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const [inventories, total] = await Promise.all([
      prisma.inventory.findMany({
        include: {
          product: true,
          variant: true,
          warehouse: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.inventory.count(),
    ]);

    return { inventories, total, page, limit };
  }

  async create(data: CreateInventoryData) {
    const quantity = data.quantity ?? 0;

    return prisma.inventory.create({
      data: {
        productId: data.productId,
        variantId: data.variantId,
        warehouseId: data.warehouseId,
        quantity,
        reservedQuantity: 0,
        reorderPoint: data.reorderPoint ?? 10,
        reorderQuantity: data.reorderQuantity,
      },
    });
  }

  async update(id: string, data: UpdateInventoryData) {
    return prisma.inventory.update({
      where: { id },
      data,
    });
  }

  async adjustQuantity(id: string, adjustment: number) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) return null;

    const newQuantity = inventory.quantity + adjustment;

    return prisma.inventory.update({
      where: { id },
      data: {
        quantity: newQuantity,
        lastRestockedAt: adjustment > 0 ? new Date() : undefined,
      },
    });
  }

  async reserveQuantity(id: string, qty: number) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory || inventory.quantity - inventory.reservedQuantity < qty) {
      throw new Error('Insufficient inventory');
    }

    return prisma.inventory.update({
      where: { id },
      data: {
        reservedQuantity: inventory.reservedQuantity + qty,
      },
    });
  }

  async releaseReservation(id: string, qty: number) {
    const inventory = await prisma.inventory.findUnique({
      where: { id },
    });

    if (!inventory) return null;

    const newReserved = Math.max(0, inventory.reservedQuantity - qty);

    return prisma.inventory.update({
      where: { id },
      data: {
        reservedQuantity: newReserved,
      },
    });
  }

  async delete(id: string) {
    return prisma.inventory.delete({
      where: { id },
    });
  }
}

export const inventoryRepository = new InventoryRepository();
