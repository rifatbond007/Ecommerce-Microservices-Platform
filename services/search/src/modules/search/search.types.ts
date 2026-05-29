export interface SearchResult {
  id: string;
  productId: string;
  name: string;
  slug: string | null;
  description: string | null;
  categoryName: string | null;
  brandName: string | null;
  sku: string | null;
  price: number;
  currency: string;
  imageUrl: string | null;
  tags: string[];
  isActive: boolean;
}

export interface SearchSuggestionsResponse {
  suggestions: string[];
}

export interface TrendingResponse {
  trending: Array<{ query: string; count: number }>;
}
