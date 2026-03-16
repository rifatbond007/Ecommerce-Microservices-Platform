export interface ProductVariantResponse {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price: string;
  compareAtPrice: string | null;
  costPerItem: string | null;
  inventoryQuantity: number;
  inventoryPolicy: string;
  weight: string | null;
  barcode: string | null;
  options: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaginatedVariantsResponse {
  data: ProductVariantResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
