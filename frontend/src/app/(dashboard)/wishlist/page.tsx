'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Image from 'next/image';
import { api } from '@/lib/api';

interface WishlistItem {
  id: string;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: { quantity: number };
  };
}

interface Wishlist {
  id: string;
  name: string;
  items: WishlistItem[];
}

export default function WishlistPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['wishlists'],
    queryFn: () => api.get<{ success: boolean; data: Wishlist[] }>('/users/wishlists'),
  });

  const removeMutation = useMutation({
    mutationFn: ({ wishlistId, productId }: { wishlistId: string; productId: string }) =>
      api.delete(`/users/wishlists/${wishlistId}/items/${productId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wishlists'] }),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const wishlists = data?.data || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Wishlists</h1>

      {wishlists.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No wishlists yet</p>
          <Link href="/products" className="text-blue-600 hover:underline">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {wishlists.map((wishlist) => (
            <div key={wishlist.id}>
              <h2 className="text-xl font-semibold mb-4">{wishlist.name}</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {wishlist.items.map((item) => (
                  <div key={item.id} className="border rounded-lg overflow-hidden">
                    <Link href={`/products/${item.product.id}`}>
                      <div className="relative h-40 bg-gray-100">
                        {item.product.images[0] ? (
                          <Image
                            src={item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-gray-400">
                            No Image
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h3 className="font-medium text-sm">{item.product.name}</h3>
                        <p className="text-lg font-bold">${item.product.price}</p>
                        <p className="text-xs text-gray-500">
                          {item.product.inventory.quantity > 0 ? 'In Stock' : 'Out of Stock'}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeMutation.mutate({ wishlistId: wishlist.id, productId: item.product.id })}
                      className="w-full py-2 text-red-600 text-sm border-t hover:bg-gray-50"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}