import { Prisma } from '@prisma/search';
import prisma from './prisma.client';
import { logger } from '../utils/logger';

export class SearchIndexRepository {
  async findByProductId(productId: string) {
    return prisma.productSearchIndex.findUnique({ where: { productId } });
  }

  async upsert(productId: string, data: Prisma.ProductSearchIndexCreateInput) {
    return prisma.productSearchIndex.upsert({
      where: { productId },
      create: data,
      update: data,
    });
  }

  async delete(productId: string) {
    return prisma.productSearchIndex.delete({ where: { productId } });
  }

  async search(query: string, options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
  } = {}) {
    const { category, minPrice, maxPrice, limit = 20, offset = 0 } = options;

    const where: Prisma.ProductSearchIndexWhereInput = { isActive: true };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { categoryName: { contains: query, mode: 'insensitive' } },
        { brandName: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryName = { equals: category, mode: 'insensitive' };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      where.price = {};
      if (minPrice !== undefined) where.price.gte = minPrice;
      if (maxPrice !== undefined) where.price.lte = maxPrice;
    }

    const [items, total] = await Promise.all([
      prisma.productSearchIndex.findMany({
        where,
        orderBy: { name: 'asc' },
        take: limit,
        skip: offset,
      }),
      prisma.productSearchIndex.count({ where }),
    ]);

    return { items, total };
  }

  async getCategories() {
    const result = await prisma.productSearchIndex.findMany({
      where: { isActive: true, categoryName: { not: null } },
      select: { categoryName: true },
      distinct: ['categoryName'],
      orderBy: { categoryName: 'asc' },
    });
    return result
      .map((r: { categoryName: string | null }) => r.categoryName)
      .filter(Boolean) as string[];
  }

  async getSuggestions(prefix: string, limit = 5) {
    return prisma.productSearchIndex.findMany({
      where: {
        isActive: true,
        name: { startsWith: prefix, mode: 'insensitive' },
      },
      select: { name: true },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async count() {
    return prisma.productSearchIndex.count({ where: { isActive: true } });
  }

  async syncAllFromProducts(products: Array<{
    id: string; name: string; slug?: string; description?: string;
    categoryName?: string; brandName?: string; sku?: string;
    price: number; imageUrl?: string; tags?: string[]; isActive?: boolean;
  }>) {
    for (const product of products) {
      await this.upsert(product.id, {
        productId: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryName: product.categoryName,
        brandName: product.brandName,
        sku: product.sku,
        price: product.price,
        imageUrl: product.imageUrl,
        tags: (product.tags || []) as any,
        isActive: product.isActive ?? true,
      });
    }
    logger.info(`Synced ${products.length} products to search index`);
  }
}

export const searchIndexRepository = new SearchIndexRepository();
