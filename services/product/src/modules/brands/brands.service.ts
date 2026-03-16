import { brandRepository } from '../../repositories';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateBrandInput, UpdateBrandInput } from './brands.validator';
import type { BrandResponse } from './brands.types';

export class BrandsService {
  async getBrandById(id: string): Promise<BrandResponse> {
    const brand = await brandRepository.findById(id);

    if (!brand) {
      throw new NotFoundError('Brand');
    }

    return this.formatBrandResponse(brand);
  }

  async getBrandBySlug(slug: string): Promise<BrandResponse> {
    const brand = await brandRepository.findBySlug(slug);

    if (!brand) {
      throw new NotFoundError('Brand');
    }

    return this.formatBrandResponse(brand);
  }

  async getAllBrands(includeInactive: boolean = false): Promise<BrandResponse[]> {
    const brands = await brandRepository.findAll(includeInactive);
    return brands.map(this.formatBrandResponse);
  }

  async createBrand(input: CreateBrandInput): Promise<BrandResponse> {
    const existing = await brandRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError('Brand with this name already exists');
    }

    const existingBySlug = await brandRepository.findBySlug(input.slug);
    if (existingBySlug) {
      throw new ConflictError('Brand with this slug already exists');
    }

    const brand = await brandRepository.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      logoUrl: input.logoUrl,
      website: input.website,
      isActive: input.isActive,
    });

    logger.info('Brand created', { brandId: brand.id, name: brand.name });

    return this.formatBrandResponse(brand);
  }

  async updateBrand(id: string, input: UpdateBrandInput): Promise<BrandResponse> {
    const existing = await brandRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Brand');
    }

    const brand = await brandRepository.update(id, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      logoUrl: input.logoUrl,
      website: input.website,
      isActive: input.isActive,
    });

    logger.info('Brand updated', { brandId: brand.id, name: brand.name });

    return this.formatBrandResponse(brand);
  }

  async deleteBrand(id: string): Promise<void> {
    const existing = await brandRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Brand');
    }

    await brandRepository.delete(id);

    logger.info('Brand deleted', { brandId: id });
  }

  private formatBrandResponse(brand: any): BrandResponse {
    return {
      id: brand.id,
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logoUrl,
      website: brand.website,
      isActive: brand.isActive,
      createdAt: brand.createdAt,
      updatedAt: brand.updatedAt,
    };
  }
}

export const brandsService = new BrandsService();
