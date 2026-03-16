import { categoryRepository } from '../../repositories';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../utils/logger';
import type { CreateCategoryInput, UpdateCategoryInput } from './categories.validator';
import type { CategoryResponse, CategoryTreeResponse } from './categories.types';

export class CategoriesService {
  async getCategoryById(id: string): Promise<CategoryResponse> {
    const category = await categoryRepository.findById(id);

    if (!category) {
      throw new NotFoundError('Category');
    }

    return this.formatCategoryResponse(category);
  }

  async getCategoryBySlug(slug: string): Promise<CategoryResponse> {
    const category = await categoryRepository.findBySlug(slug);

    if (!category) {
      throw new NotFoundError('Category');
    }

    return this.formatCategoryResponse(category);
  }

  async getAllCategories(includeInactive: boolean = false): Promise<CategoryResponse[]> {
    const categories = await categoryRepository.findAll(includeInactive);
    return categories.map(this.formatCategoryResponse);
  }

  async getCategoryTree(): Promise<CategoryTreeResponse[]> {
    const categories = await categoryRepository.findAll(false);
    return this.buildCategoryTree(categories);
  }

  async createCategory(input: CreateCategoryInput): Promise<CategoryResponse> {
    const existing = await categoryRepository.findByName(input.name);
    if (existing) {
      throw new ConflictError('Category with this name already exists');
    }

    const existingBySlug = await categoryRepository.findBySlug(input.slug);
    if (existingBySlug) {
      throw new ConflictError('Category with this slug already exists');
    }

    if (input.parentId) {
      const parent = await categoryRepository.findById(input.parentId);
      if (!parent) {
        throw new NotFoundError('Parent category');
      }
    }

    const category = await categoryRepository.create({
      name: input.name,
      slug: input.slug,
      description: input.description,
      parentId: input.parentId,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
    });

    logger.info('Category created', { categoryId: category.id, name: category.name });

    return this.formatCategoryResponse(category);
  }

  async updateCategory(id: string, input: UpdateCategoryInput): Promise<CategoryResponse> {
    const existing = await categoryRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Category');
    }

    if (input.parentId) {
      const parent = await categoryRepository.findById(input.parentId);
      if (!parent) {
        throw new NotFoundError('Parent category');
      }
      if (input.parentId === id) {
        throw new ConflictError('Category cannot be its own parent');
      }
    }

    const category = await categoryRepository.update(id, {
      name: input.name,
      slug: input.slug,
      description: input.description,
      parentId: input.parentId,
      isActive: input.isActive,
      displayOrder: input.displayOrder,
    });

    logger.info('Category updated', { categoryId: category.id, name: category.name });

    return this.formatCategoryResponse(category);
  }

  async deleteCategory(id: string): Promise<void> {
    const existing = await categoryRepository.findById(id);

    if (!existing) {
      throw new NotFoundError('Category');
    }

    const hasProducts = await categoryRepository.hasProducts(id);
    if (hasProducts) {
      throw new ConflictError('Cannot delete category with products');
    }

    await categoryRepository.delete(id);

    logger.info('Category deleted', { categoryId: id });
  }

  private formatCategoryResponse(category: any): CategoryResponse {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      parentId: category.parentId,
      isActive: category.isActive,
      sortOrder: category.sortOrder,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
      parent: category.parent ? this.formatCategoryResponse(category.parent) : null,
      children: category.children?.map(this.formatCategoryResponse) || [],
    };
  }

  private buildCategoryTree(categories: any[]): CategoryTreeResponse[] {
    const categoryMap = new Map<string, CategoryTreeResponse>();
    const roots: CategoryTreeResponse[] = [];

    categories.forEach((cat) => {
      categoryMap.set(cat.id, {
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        isActive: cat.isActive,
        sortOrder: cat.sortOrder,
        children: [],
        productCount: cat._count?.products || 0,
      });
    });

    categories.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        categoryMap.get(cat.parentId)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    const sortCategories = (items: CategoryTreeResponse[]): CategoryTreeResponse[] => {
      return items
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => ({
          ...item,
          children: sortCategories(item.children),
        }));
    };

    return sortCategories(roots);
  }
}

export const categoriesService = new CategoriesService();
