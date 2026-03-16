export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
  parent: CategoryResponse | null;
  children: CategoryResponse[];
}

export interface CategoryTreeResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
  children: CategoryTreeResponse[];
  productCount: number;
}
