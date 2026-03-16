import prisma from './prisma.client';

export interface CreateBrandData {
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  website?: string;
  isActive?: boolean;
}

export interface UpdateBrandData {
  name?: string;
  slug?: string;
  description?: string | null;
  logoUrl?: string | null;
  website?: string | null;
  isActive?: boolean;
}

export class BrandRepository {
  async findById(id: string) {
    return prisma.brand.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string) {
    return prisma.brand.findUnique({
      where: { slug },
    });
  }

  async findByName(name: string) {
    return prisma.brand.findFirst({
      where: { name },
    });
  }

  async findAll(includeInactive: boolean = false) {
    return prisma.brand.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: CreateBrandData) {
    return prisma.brand.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        logoUrl: data.logoUrl,
        website: data.website,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateBrandData) {
    return prisma.brand.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.brand.delete({
      where: { id },
    });
  }
}

export const brandRepository = new BrandRepository();
