import { inventoryRepository, warehouseRepository, productRepository } from '../../repositories';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateInventoryInput, InventoryQueryInput, CreateWarehouseInput, UpdateWarehouseInput } from './inventory.validator';
import type { InventoryResponse, PaginatedInventoryResponse, WarehouseResponse } from './inventory.types';

export class InventoryService {
  async getInventoryById(id: string): Promise<InventoryResponse> {
    const inventory = await inventoryRepository.findById(id);

    if (!inventory) {
      throw new NotFoundError('Inventory');
    }

    return this.formatInventoryResponse(inventory);
  }

  async getInventoryByProductId(productId: string): Promise<InventoryResponse[]> {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError('Product');
    }

    const inventories = await inventoryRepository.findByProductId(productId);
    return inventories.map(this.formatInventoryResponse);
  }

  async getInventoryByVariantId(variantId: string): Promise<InventoryResponse | null> {
    const inventory = await inventoryRepository.findByVariantId(variantId);

    if (!inventory) {
      return null;
    }

    return this.formatInventoryResponse(inventory);
  }

  async getInventories(query: InventoryQueryInput): Promise<PaginatedInventoryResponse> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);

    if (query.lowStock) {
      const inventories = await inventoryRepository.findLowStock();
      return {
        data: inventories.map(this.formatInventoryResponse),
        pagination: {
          page,
          limit,
          total: inventories.length,
          totalPages: 1,
        },
      };
    }

    if (query.outOfStock) {
      const inventories = await inventoryRepository.findOutOfStock();
      return {
        data: inventories.map(this.formatInventoryResponse),
        pagination: {
          page,
          limit,
          total: inventories.length,
          totalPages: 1,
        },
      };
    }

    const result = await inventoryRepository.findAll(page, limit);

    return {
      data: result.inventories.map(this.formatInventoryResponse),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async createInventory(input: CreateInventoryInput): Promise<InventoryResponse> {
    const product = await productRepository.findById(input.productId);

    if (!product) {
      throw new NotFoundError('Product');
    }

    const warehouse = await warehouseRepository.findById(input.warehouseId);

    if (!warehouse) {
      throw new NotFoundError('Warehouse');
    }

    const inventory = await inventoryRepository.create({
      productId: input.productId,
      variantId: input.variantId,
      warehouseId: input.warehouseId,
      quantity: input.quantity,
      reorderPoint: input.reorderPoint,
      reorderQuantity: input.reorderQuantity,
    });

    logger.info('Inventory created', { inventoryId: inventory.id, productId: input.productId });

    return this.formatInventoryResponse(inventory);
  }

  async adjustQuantity(id: string, adjustment: number): Promise<InventoryResponse> {
    const inventory = await inventoryRepository.findById(id);

    if (!inventory) {
      throw new NotFoundError('Inventory');
    }

    const updated = await inventoryRepository.adjustQuantity(id, adjustment);

    if (!updated) {
      throw new NotFoundError('Inventory');
    }

    logger.info('Inventory adjusted', { inventoryId: id, adjustment, newQuantity: updated.quantity });

    return this.formatInventoryResponse(updated);
  }

  async reserveQuantity(id: string, quantity: number): Promise<InventoryResponse> {
    const inventory = await inventoryRepository.findById(id);

    if (!inventory) {
      throw new NotFoundError('Inventory');
    }

    try {
      const updated = await inventoryRepository.reserveQuantity(id, quantity);
      logger.info('Inventory reserved', { inventoryId: id, quantity });
      return this.formatInventoryResponse(updated);
    } catch (error) {
      throw new Error('Insufficient inventory');
    }
  }

  async releaseReservation(id: string, quantity: number): Promise<InventoryResponse> {
    const inventory = await inventoryRepository.findById(id);

    if (!inventory) {
      throw new NotFoundError('Inventory');
    }

    const updated = await inventoryRepository.releaseReservation(id, quantity);

    if (!updated) {
      throw new NotFoundError('Inventory');
    }

    logger.info('Inventory reservation released', { inventoryId: id, quantity });

    return this.formatInventoryResponse(updated);
  }

  async deleteInventory(id: string): Promise<void> {
    const inventory = await inventoryRepository.findById(id);

    if (!inventory) {
      throw new NotFoundError('Inventory');
    }

    await inventoryRepository.delete(id);

    logger.info('Inventory deleted', { inventoryId: id });
  }

  private formatInventoryResponse(inventory: any): InventoryResponse {
    return {
      id: inventory.id,
      productId: inventory.productId,
      variantId: inventory.variantId,
      warehouseId: inventory.warehouseId,
      quantity: inventory.quantity,
      reservedQuantity: inventory.reservedQuantity,
      reorderPoint: inventory.reorderPoint,
      reorderQuantity: inventory.reorderQuantity,
      lastRestockedAt: inventory.lastRestockedAt,
      createdAt: inventory.createdAt,
      updatedAt: inventory.updatedAt,
      product: {
        id: inventory.product.id,
        name: inventory.product.name,
        sku: inventory.product.sku,
      },
      variant: inventory.variant ? {
        id: inventory.variant.id,
        name: inventory.variant.name,
        sku: inventory.variant.sku,
      } : null,
      warehouse: {
        id: inventory.warehouse.id,
        name: inventory.warehouse.name,
        code: inventory.warehouse.code,
      },
    };
  }
}

export class WarehouseService {
  async getWarehouseById(id: string): Promise<WarehouseResponse> {
    const warehouse = await warehouseRepository.findById(id);

    if (!warehouse) {
      throw new NotFoundError('Warehouse');
    }

    return this.formatWarehouseResponse(warehouse);
  }

  async getAllWarehouses(includeInactive: boolean = false): Promise<WarehouseResponse[]> {
    const warehouses = await warehouseRepository.findAll(includeInactive);
    return warehouses.map(this.formatWarehouseResponse);
  }

  async createWarehouse(input: CreateWarehouseInput): Promise<WarehouseResponse> {
    const existing = await warehouseRepository.findByCode(input.code);
    if (existing) {
      throw new NotFoundError('Warehouse with this code already exists');
    }

    const warehouse = await warehouseRepository.create({
      name: input.name,
      code: input.code,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      isActive: input.isActive,
    });

    logger.info('Warehouse created', { warehouseId: warehouse.id, name: warehouse.name });

    return this.formatWarehouseResponse(warehouse);
  }

  async updateWarehouse(id: string, input: UpdateWarehouseInput): Promise<WarehouseResponse> {
    const existing = await warehouseRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Warehouse');
    }

    const warehouse = await warehouseRepository.update(id, {
      name: input.name,
      code: input.code,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      city: input.city,
      state: input.state,
      postalCode: input.postalCode,
      country: input.country,
      isActive: input.isActive,
    });

    logger.info('Warehouse updated', { warehouseId: warehouse.id, name: warehouse.name });

    return this.formatWarehouseResponse(warehouse);
  }

  async deleteWarehouse(id: string): Promise<void> {
    const existing = await warehouseRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Warehouse');
    }

    await warehouseRepository.delete(id);

    logger.info('Warehouse deleted', { warehouseId: id });
  }

  private formatWarehouseResponse(warehouse: any): WarehouseResponse {
    return {
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      addressLine1: warehouse.addressLine1,
      addressLine2: warehouse.addressLine2,
      city: warehouse.city,
      state: warehouse.state,
      postalCode: warehouse.postalCode,
      country: warehouse.country,
      isActive: warehouse.isActive,
      createdAt: warehouse.createdAt,
      updatedAt: warehouse.updatedAt,
    };
  }
}

export const inventoryService = new InventoryService();
export const warehouseService = new WarehouseService();
