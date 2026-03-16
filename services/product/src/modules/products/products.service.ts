import { productRepository } from '../../repositories';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateProductInput, UpdateProductInput, ProductQueryInput } from './products.validator';
import type { ProductResponse, ProductListResponse } from './products.types';

export class ProductsService {
  async getProductById(id: string): Promise<ProductResponse> {
    const product = await productRepository.findById(id);

    if (!product) {
      throw new NotFoundError('Product');
    }

    return this.formatProductResponse(product);
  }

  async getProductBySlug(slug: string): Promise<ProductResponse> {
    const product = await productRepository.findBySlug(slug);

    if (!product) {
      throw new NotFoundError('Product');
    }

    return this.formatProductResponse(product);
  }

  async getProducts(query: ProductQueryInput): Promise<{ data: ProductListResponse[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '20', 10);

    const filters = {
      categoryId: query.categoryId,
      brandId: query.brandId,
      isActive: query.isActive,
      isFeatured: query.isFeatured,
      search: query.search,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
    };

    const result = await productRepository.findAll(filters, page, limit);

    return {
      data: result.products.map(this.formatProductListResponse),
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / result.limit),
      },
    };
  }

  async createProduct(input: CreateProductInput): Promise<ProductResponse> {
    const existingBySku = await productRepository.findBySku(input.sku);
    if (existingBySku) {
      throw new ConflictError('Product with this SKU already exists');
    }

    const product = await productRepository.create({
      sku: input.sku,
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      brandId: input.brandId,
      basePrice: input.basePrice,
      compareAtPrice: input.compareAtPrice,
      costPerItem: input.costPerItem,
      weight: input.weight,
      requiresShipping: input.requiresShipping,
      isTaxable: input.isTaxable,
      taxRate: input.taxRate,
      tags: input.tags,
      images: input.images as any,
      videoUrl: input.videoUrl,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
    });

    logger.info('Product created', { productId: product.id, name: product.name });

    return this.formatProductResponse(product);
  }

  async updateProduct(id: string, input: UpdateProductInput): Promise<ProductResponse> {
    const existing = await productRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Product');
    }

    if (input.sku && input.sku !== existing.sku) {
      const existingBySku = await productRepository.findBySku(input.sku);
      if (existingBySku) {
        throw new ConflictError('Product with this SKU already exists');
      }
    }

    const product = await productRepository.update(id, {
      sku: input.sku,
      name: input.name,
      slug: input.slug,
      description: input.description,
      categoryId: input.categoryId,
      brandId: input.brandId,
      basePrice: input.basePrice,
      compareAtPrice: input.compareAtPrice,
      costPerItem: input.costPerItem,
      weight: input.weight,
      requiresShipping: input.requiresShipping,
      isTaxable: input.isTaxable,
      taxRate: input.taxRate,
      tags: input.tags,
      images: input.images as any,
      videoUrl: input.videoUrl,
      metaTitle: input.metaTitle,
      metaDescription: input.metaDescription,
      isActive: input.isActive,
      isFeatured: input.isFeatured,
    });

    logger.info('Product updated', { productId: product.id, name: product.name });

    return this.formatProductResponse(product);
  }

  async deleteProduct(id: string): Promise<void> {
    const existing = await productRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Product');
    }

    await productRepository.delete(id);

    logger.info('Product deleted', { productId: id });
  }

  async getFeaturedProducts(limit: number = 10): Promise<ProductListResponse[]> {
    const result = await productRepository.findAll({ isFeatured: true, isActive: true }, 1, limit);
    return result.products.map(this.formatProductListResponse);
  }

  private formatProductResponse(product: any): ProductResponse {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      categoryId: product.categoryId,
      brandId: product.brandId,
      basePrice: product.basePrice.toString(),
      compareAtPrice: product.compareAtPrice?.toString() ?? null,
      costPerItem: product.costPerItem?.toString() ?? null,
      weight: product.weight?.toString() ?? null,
      requiresShipping: product.requiresShipping,
      isTaxable: product.isTaxable,
      taxRate: product.taxRate?.toString() ?? null,
      tags: product.tags,
      images: product.images,
      videoUrl: product.videoUrl,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
      totalSold: product.totalSold,
      totalRevenue: product.totalRevenue.toString(),
      averageRating: product.averageRating.toString(),
      reviewCount: product.reviewCount,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : null,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
      } : null,
    };
  }

  private formatProductListResponse(product: any): ProductListResponse {
    return {
      id: product.id,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      basePrice: product.basePrice.toString(),
      compareAtPrice: product.compareAtPrice?.toString() ?? null,
      isActive: product.isActive,
      isFeatured: product.isFeatured,
      tags: product.tags,
      images: product.images,
      totalSold: product.totalSold,
      averageRating: product.averageRating.toString(),
      reviewCount: product.reviewCount,
      category: product.category ? {
        id: product.category.id,
        name: product.category.name,
        slug: product.category.slug,
      } : null,
      brand: product.brand ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
      } : null,
      variants: product.variants?.map((v: any) => ({
        id: v.id,
        name: v.name,
        price: v.price.toString(),
        sku: v.sku,
      })) || [],
    };
  }
}

export const productsService = new ProductsService();
