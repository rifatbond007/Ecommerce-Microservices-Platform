import { Prisma } from '@prisma/client';
import prisma from './prisma.client';

export interface CreateProductData {
  sku: string;
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  brandId?: string;
  basePrice: number;
  compareAtPrice?: number;
  costPerItem?: number;
  weight?: number;
  requiresShipping?: boolean;
  isTaxable?: boolean;
  taxRate?: number;
  tags?: string[];
  images?: Prisma.InputJsonValue;
  videoUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateProductData {
  sku?: string;
  name?: string;
  slug?: string;
  description?: string | null;
  categoryId?: string;
  brandId?: string | null;
  basePrice?: number;
  compareAtPrice?: number | null;
  costPerItem?: number | null;
  weight?: number | null;
  requiresShipping?: boolean;
  isTaxable?: boolean;
  taxRate?: number | null;
  tags?: string[];
  images?: Prisma.InputJsonValue;
  videoUrl?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  totalSold?: number;
  totalRevenue?: number;
  averageRating?: number;
  reviewCount?: number;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface ProductFilters {
  categoryId?: string;
  brandId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
}

export class ProductRepository {
  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        brand: true,
        variants: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        brand: true,
        variants: {
          where: { isActive: true },
        },
      },
    });
  }

  async findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku },
    });
  }

  async findAll(filters: ProductFilters = {}, page: number = 1, limit: number = 20) {
    const where: any = {};

    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.brandId) {
      where.brandId = filters.brandId;
    }
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters.isFeatured !== undefined) {
      where.isFeatured = filters.isFeatured;
    }
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
    if (filters.tags && filters.tags.length > 0) {
      where.tags = { hasSome: filters.tags };
    }
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.basePrice = {};
      if (filters.minPrice !== undefined) {
        where.basePrice.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.basePrice.lte = filters.maxPrice;
      }
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          brand: true,
          variants: {
            where: { isActive: true },
            take: 1,
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return { products, total, page, limit };
  }

  async create(data: CreateProductData) {
    return prisma.product.create({
      data: {
        sku: data.sku,
        name: data.name,
        slug: data.slug,
        description: data.description,
        categoryId: data.categoryId,
        brandId: data.brandId,
        basePrice: data.basePrice,
        compareAtPrice: data.compareAtPrice,
        costPerItem: data.costPerItem,
        weight: data.weight,
        requiresShipping: data.requiresShipping ?? true,
        isTaxable: data.isTaxable ?? true,
        taxRate: data.taxRate,
        tags: data.tags ?? [],
        images: data.images ?? [],
        videoUrl: data.videoUrl,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        isActive: data.isActive ?? true,
        isFeatured: data.isFeatured ?? false,
        totalSold: 0,
        totalRevenue: 0,
        averageRating: 0,
        reviewCount: 0,
      },
    });
  }

  async update(id: string, data: UpdateProductData) {
    const updateData: any = {
      sku: data.sku,
      name: data.name,
      slug: data.slug,
      description: data.description,
      basePrice: data.basePrice,
      compareAtPrice: data.compareAtPrice,
      costPerItem: data.costPerItem,
      weight: data.weight,
      requiresShipping: data.requiresShipping,
      isTaxable: data.isTaxable,
      taxRate: data.taxRate,
      tags: data.tags,
      images: data.images,
      videoUrl: data.videoUrl,
      metaTitle: data.metaTitle,
      metaDescription: data.metaDescription,
      totalSold: data.totalSold,
      totalRevenue: data.totalRevenue,
      averageRating: data.averageRating,
      reviewCount: data.reviewCount,
      isActive: data.isActive,
      isFeatured: data.isFeatured,
    };

    if (data.categoryId) {
      updateData.category = { connect: { id: data.categoryId } };
    }
    if (data.brandId === null) {
      updateData.brand = { disconnect: true };
    } else if (data.brandId) {
      updateData.brand = { connect: { id: data.brandId } };
    }

    return prisma.product.update({
      where: { id },
      data: updateData,
    });
  }

  async delete(id: string) {
    return prisma.product.delete({
      where: { id },
    });
  }

  async updateRating(id: string, averageRating: number, reviewCount: number) {
    return prisma.product.update({
      where: { id },
      data: { averageRating, reviewCount },
    });
  }

  async incrementSales(id: string, quantity: number, revenue: number) {
    return prisma.product.update({
      where: { id },
      data: {
        totalSold: { increment: quantity },
        totalRevenue: { increment: revenue },
      },
    });
  }
}

export const productRepository = new ProductRepository();
