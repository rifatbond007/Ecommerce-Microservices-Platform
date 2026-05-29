'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
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
  category?: { id: string; name: string };
  brand?: { id: string; name: string };
  inventory: { quantity: number };
  variants?: { id: string; name: string; options: string[] }[];
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => api.get<{ success: boolean; data: Product }>(`/products/${productId}`),
  });

  const addToCart = async () => {
    try {
      await api.post('/cart/items', { productId, quantity: 1 });
      router.push('/cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (error || !data?.data) return <div className="p-8 text-center text-red-500">Product not found</div>;

  const product = data.data;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="relative h-96 bg-gray-100 rounded-lg overflow-hidden">
            {product.images[0] ? (
              <Image 
                src={product.images[0]} 
                alt={product.name}
                fill
                className="object-contain"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {product.images.map((img, idx) => (
              <div key={idx} className="relative w-20 h-20 bg-gray-100 rounded">
                <Image src={img} alt={`${product.name} ${idx + 1}`} fill className="object-cover rounded" />
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm text-gray-500 mb-1">
            {product.category?.name} {product.brand && `/ ${product.brand.name}`}
          </p>
          <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <span className="text-2xl font-bold">${product.price}</span>
            {product.compareAtPrice && (
              <span className="text-lg text-gray-500 line-through">
                ${product.compareAtPrice}
              </span>
            )}
          </div>

          <p className="text-gray-600 mb-6">{product.description}</p>

          <div className="mb-6">
            <p className="text-sm mb-2">
              {product.inventory.quantity > 0 ? (
                <span className="text-green-600">In Stock ({product.inventory.quantity} available)</span>
              ) : (
                <span className="text-red-600">Out of Stock</span>
              )}
            </p>
          </div>

          <button
            onClick={addToCart}
            disabled={product.inventory.quantity <= 0}
            className="w-full py-3 px-6 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {product.inventory.quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
          </button>
        </div>
      </div>
    </div>
  );
}