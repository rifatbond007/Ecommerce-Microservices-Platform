export interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  website: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrandWithProducts extends BrandResponse {
  productCount: number;
  products: any[];
}
