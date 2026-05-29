import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { Mock } from 'jest';

const mockSearchIndexSearch = jest.fn() as Mock<Promise<any>, [string, any]>;
const mockSearchIndexGetCategories = jest.fn() as Mock<Promise<string[]>, []>;
const mockSearchIndexGetSuggestions = jest.fn() as Mock<Promise<{ name: string }[]>, [string, number]>;
const mockSearchLogLog = jest.fn() as Mock<Promise<any>, [any]>;
const mockSearchLogGetTrending = jest.fn() as Mock<Promise<{ query: string; count: number }[]>, [number]>;

jest.mock('../src/repositories/search-index.repository', () => ({
  searchIndexRepository: {
    search: mockSearchIndexSearch,
    getCategories: mockSearchIndexGetCategories,
    getSuggestions: mockSearchIndexGetSuggestions,
  },
}));

jest.mock('../src/repositories/search-log.repository', () => ({
  searchLogRepository: {
    log: mockSearchLogLog,
    getTrending: mockSearchLogGetTrending,
  },
}));

describe('SearchService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should return search results and categories', async () => {
      const { searchService } = await import('../src/modules/search/search.service');

      mockSearchIndexSearch.mockResolvedValue({
        items: [
          {
            id: 'idx-1',
            productId: 'prod-1',
            name: 'Test Product',
            slug: 'test-product',
            description: 'A test product',
            categoryName: 'Electronics',
            brandName: 'TestBrand',
            sku: 'TST-001',
            price: 29.99,
            currency: 'USD',
            imageUrl: 'http://example.com/img.jpg',
            tags: ['test'],
            isActive: true,
          },
        ],
        total: 1,
      });
      mockSearchIndexGetCategories.mockResolvedValue(['Electronics']);
      mockSearchLogLog.mockResolvedValue({ id: 'log-1' });

      const result = await searchService.search('test', {});

      expect(result.results).toHaveLength(1);
      expect(result.results[0].name).toBe('Test Product');
      expect(result.total).toBe(1);
      expect(result.categories).toEqual(['Electronics']);
    });
  });

  describe('getTrending', () => {
    it('should return trending searches', async () => {
      const { searchService } = await import('../src/modules/search/search.service');

      mockSearchLogGetTrending.mockResolvedValue([
        { query: 'laptop', count: 42 },
        { query: 'phone', count: 30 },
      ]);

      const result = await searchService.getTrending();

      expect(result.trending).toHaveLength(2);
      expect(result.trending[0].query).toBe('laptop');
    });
  });

  describe('getSuggestions', () => {
    it('should return autocomplete suggestions', async () => {
      const { searchService } = await import('../src/modules/search/search.service');

      mockSearchIndexGetSuggestions.mockResolvedValue([
        { name: 'iPhone 15' },
        { name: 'iPhone Case' },
      ]);

      const result = await searchService.getSuggestions('iph');

      expect(result.suggestions).toHaveLength(2);
      expect(result.suggestions[0]).toBe('iPhone 15');
    });
  });
});
