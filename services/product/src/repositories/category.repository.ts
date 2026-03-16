import prisma from './prisma.client';

export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  parentId?: string;
  isActive?: boolean;
  displayOrder?: number;
}

export interface UpdateCategoryData {
  name?: string;
  slug?: string;
  description?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  isActive?: boolean;
  displayOrder?: number;
}

export class CategoryRepository {
  async findById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        parent: true,
        children: true,
      },
    });
  }

  async findBySlug(slug: string) {
    return prisma.category.findUnique({
      where: { slug },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
    });
  }

  async findByName(name: string) {
    return prisma.category.findFirst({
      where: { name },
    });
  }

  async findAll(includeInactive: boolean = false) {
    return prisma.category.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        parent: true,
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async findRootCategories() {
    return prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });
  }

  async create(data: CreateCategoryData) {
    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        isActive: data.isActive ?? true,
        displayOrder: data.displayOrder ?? 0,
      },
    });
  }

  async update(id: string, data: UpdateCategoryData) {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    return prisma.category.delete({
      where: { id },
    });
  }

  async hasProducts(id: string) {
    const count = await prisma.product.count({
      where: { categoryId: id },
    });
    return count > 0;
  }
}

export const categoryRepository = new CategoryRepository();
