import { productVariantRepository, productRepository } from '../../repositories';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateProductVariantInput, UpdateProductVariantInput } from './variants.validator';
import type { ProductVariantResponse } from './variants.types';

export class VariantsService {
  async getVariantById(id: string): Promise<ProductVariantResponse> {
    const variant = await productVariantRepository.findById(id);

    if (!variant) {
      throw new NotFoundError('Product variant');
    }

    return this.formatVariantResponse(variant);
  }

  async getVariantsByProductId(productId: string): Promise<ProductVariantResponse[]> {
    const product = await productRepository.findById(productId);

    if (!product) {
      throw new NotFoundError('Product');
    }

    const variants = await productVariantRepository.findByProductId(productId);
    return variants.map(this.formatVariantResponse);
  }

  async createVariant(input: CreateProductVariantInput): Promise<ProductVariantResponse> {
    const product = await productRepository.findById(input.productId);

    if (!product) {
      throw new NotFoundError('Product');
    }

    const existingBySku = await productVariantRepository.findBySku(input.sku);
    if (existingBySku) {
      throw new ConflictError('Variant with this SKU already exists');
    }

    const variant = await productVariantRepository.create({
      productId: input.productId,
      sku: input.sku,
      name: input.name,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      costPerItem: input.costPerItem,
      inventoryQuantity: input.inventoryQuantity,
      inventoryPolicy: input.inventoryPolicy,
      weight: input.weight,
      barcode: input.barcode,
      options: input.options,
      isActive: input.isActive,
    });

    logger.info('Product variant created', { variantId: variant.id, name: variant.name });

    return this.formatVariantResponse(variant);
  }

  async updateVariant(id: string, input: UpdateProductVariantInput): Promise<ProductVariantResponse> {
    const variant = await productVariantRepository.findById(id);

    if (!variant) {
      throw new NotFoundError('Product variant');
    }

    if (input.sku && input.sku !== variant.sku) {
      const existingBySku = await productVariantRepository.findBySku(input.sku);
      if (existingBySku) {
        throw new ConflictError('Variant with this SKU already exists');
      }
    }

    const updated = await productVariantRepository.update(id, {
      sku: input.sku,
      name: input.name,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      costPerItem: input.costPerItem,
      inventoryQuantity: input.inventoryQuantity,
      inventoryPolicy: input.inventoryPolicy,
      weight: input.weight,
      barcode: input.barcode,
      options: input.options,
      isActive: input.isActive,
    });

    logger.info('Product variant updated', { variantId: id, name: updated.name });

    return this.formatVariantResponse(updated);
  }

  async deleteVariant(id: string): Promise<void> {
    const variant = await productVariantRepository.findById(id);

    if (!variant) {
      throw new NotFoundError('Product variant');
    }

    await productVariantRepository.delete(id);

    logger.info('Product variant deleted', { variantId: id });
  }

  private formatVariantResponse(variant: any): ProductVariantResponse {
    return {
      id: variant.id,
      productId: variant.productId,
      sku: variant.sku,
      name: variant.name,
      price: variant.price.toString(),
      compareAtPrice: variant.compareAtPrice?.toString() ?? null,
      costPerItem: variant.costPerItem?.toString() ?? null,
      inventoryQuantity: variant.inventoryQuantity,
      inventoryPolicy: variant.inventoryPolicy,
      weight: variant.weight?.toString() ?? null,
      barcode: variant.barcode,
      options: variant.options,
      isActive: variant.isActive,
      createdAt: variant.createdAt,
      updatedAt: variant.updatedAt,
    };
  }
}

export const variantsService = new VariantsService();
