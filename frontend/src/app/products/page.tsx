'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category?: { name: string };
  brand?: { name: string };
  inventory: { quantity: number };
}

export default function ProductsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get<{ success: boolean; data: Product[] }>('/products'),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Failed to load products</div>;

  const products = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Products</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link 
            key={product.id} 
            href={`/products/${product.id}`}
            className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
          >
            <div className="relative h-48 bg-gray-100">
              {product.images[0] ? (
                <Image 
                  src={product.images[0]} 
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
            </div>
            <div className="p-4">
              <h2 className="font-semibold text-lg">{product.name}</h2>
              <p className="text-gray-600 text-sm mb-2">{product.category?.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">${product.price}</span>
                {product.compareAtPrice && (
                  <span className="text-sm text-gray-500 line-through">
                    ${product.compareAtPrice}
                  </span>
                )}
              </div>
              <p className="text-sm mt-1">
                {product.inventory.quantity > 0 ? (
                  <span className="text-green-600">In Stock</span>
                ) : (
                  <span className="text-red-600">Out of Stock</span>
                )}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}