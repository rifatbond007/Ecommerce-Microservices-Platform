import prisma from './prisma.client';

export interface CreateProductVariantData {
  productId: string;
  sku: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  costPerItem?: number;
  inventoryQuantity?: number;
  inventoryPolicy?: string;
  weight?: number;
  barcode?: string;
  options?: Record<string, string>;
  isActive?: boolean;
}

export interface UpdateProductVariantData {
  sku?: string;
  name?: string;
  price?: number;
  compareAtPrice?: number | null;
  costPerItem?: number | null;
  inventoryQuantity?: number;
  inventoryPolicy?: string;
  weight?: number | null;
  barcode?: string | null;
  options?: Record<string, string>;
  isActive?: boolean;
}

export class ProductVariantRepository {
  async findById(id: string) {
    return prisma.productVariant.findUnique({
      where: { id },
      include: {
        product: true,
        inventories: true,
      },
    });
  }

  async findBySku(sku: string) {
    return prisma.productVariant.findUnique({
      where: { sku },
    });
  }

  async findByProductId(productId: string) {
    return prisma.productVariant.findMany({
      where: { productId },
      include: {
        inventories: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAll(page: number = 1, limit: number = 20) {
    const [variants, total] = await Promise.all([
      prisma.productVariant.findMany({
        include: {
          product: true,
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.productVariant.count(),
    ]);

    return { variants, total, page, limit };
  }

  async create(data: CreateProductVariantData) {
    return prisma.productVariant.create({
      data: {
        productId: data.productId,
        sku: data.sku,
        name: data.name,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPerItem: data.costPerItem,
        inventoryQuantity: data.inventoryQuantity ?? 0,
        inventoryPolicy: data.inventoryPolicy ?? 'deny',
        weight: data.weight,
        barcode: data.barcode,
        options: data.options ?? {},
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateProductVariantData) {
    return prisma.productVariant.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        price: data.price,
        compareAtPrice: data.compareAtPrice,
        costPerItem: data.costPerItem,
        inventoryQuantity: data.inventoryQuantity,
        inventoryPolicy: data.inventoryPolicy,
        weight: data.weight,
        barcode: data.barcode,
        options: data.options,
        isActive: data.isActive,
      },
    });
  }

  async delete(id: string) {
    return prisma.productVariant.delete({
      where: { id },
    });
  }
}

export const productVariantRepository = new ProductVariantRepository();
