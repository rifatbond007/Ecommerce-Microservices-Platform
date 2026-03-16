export interface InventoryResponse {
  id: string;
  productId: string;
  variantId: string | null;
  warehouseId: string;
  quantity: number;
  reservedQuantity: number;
  reorderPoint: number;
  reorderQuantity: number | null;
  lastRestockedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    sku: string;
  };
  variant: {
    id: string;
    name: string;
    sku: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
    code: string;
  };
}

export interface PaginatedInventoryResponse {
  data: InventoryResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface WarehouseResponse {
  id: string;
  name: string;
  code: string;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
