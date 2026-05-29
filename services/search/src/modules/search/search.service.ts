import { searchIndexRepository, searchLogRepository } from '../../repositories';
import { logger } from '../../utils/logger';
import type { SearchResult, SearchSuggestionsResponse, TrendingResponse } from './search.types';

function toSearchResult(item: any): SearchResult {
  return {
    id: item.id,
    productId: item.productId,
    name: item.name,
    slug: item.slug,
    description: item.description,
    categoryName: item.categoryName,
    brandName: item.brandName,
    sku: item.sku,
    price: Number(item.price),
    currency: item.currency,
    imageUrl: item.imageUrl,
    tags: item.tags as string[],
    isActive: item.isActive,
  };
}

export class SearchService {
  async search(query: string, options: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    limit?: number;
    offset?: number;
    userId?: string;
  }): Promise<{ results: SearchResult[]; total: number; categories: string[] }> {
    const { items, total } = await searchIndexRepository.search(query, options);
    const categories = await searchIndexRepository.getCategories();

    await searchLogRepository.log({
      userId: options.userId,
      query,
      filters: { category: options.category, minPrice: options.minPrice, maxPrice: options.maxPrice },
      resultsCount: total,
    });

    return {
      results: items.map(toSearchResult),
      total,
      categories,
    };
  }

  async getSuggestions(prefix: string, limit = 5): Promise<SearchSuggestionsResponse> {
    const items = await searchIndexRepository.getSuggestions(prefix, limit);
    return { suggestions: items.map((i) => i.name) };
  }

  async getTrending(limit = 10): Promise<TrendingResponse> {
    const trending = await searchLogRepository.getTrending(limit);
    return { trending };
  }

  async logClick(productId: string, logId?: string): Promise<void> {
    await searchLogRepository.click(productId, logId);
  }

  async reindexProduct(product: {
    id: string; name: string; slug?: string; description?: string;
    categoryName?: string; brandName?: string; sku?: string;
    price: number; imageUrl?: string; tags?: string[]; isActive?: boolean;
  }) {
    await searchIndexRepository.upsert(product.id, {
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
    logger.info(`Indexed product: ${product.id}`);
  }

  async removeProduct(productId: string) {
    try {
      await searchIndexRepository.delete(productId);
      logger.info(`Removed product from index: ${productId}`);
    } catch {
      // May not exist
    }
  }
}

export const searchService = new SearchService();
