export interface ProductResponse {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  categoryId: string;
  brandId: string | null;
  basePrice: string;
  compareAtPrice: string | null;
  costPerItem: string | null;
  weight: string | null;
  requiresShipping: boolean;
  isTaxable: boolean;
  taxRate: string | null;
  tags: unknown[];
  images: unknown[];
  videoUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  totalSold: number;
  totalRevenue: string;
  averageRating: string;
  reviewCount: number;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
}

export interface ProductListResponse {
  id: string;
  sku: string;
  name: string;
  slug: string;
  basePrice: string;
  compareAtPrice: string | null;
  isActive: boolean;
  isFeatured: boolean;
  tags: unknown[];
  images: unknown[];
  totalSold: number;
  averageRating: string;
  reviewCount: number;
  category: {
    id: string;
    name: string;
    slug: string;
  } | null;
  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;
  variants: {
    id: string;
    name: string;
    price: string;
    sku: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
