'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    images: string[];
    inventory: { quantity: number };
  };
}

interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
}

export default function CartPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get<{ success: boolean; data: Cart }>('/cart'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      api.put(`/cart/items/${itemId}`, { quantity }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (itemId: string) => api.delete(`/cart/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const cart = data?.data;
  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
        <Link href="/products" className="text-blue-600 hover:underline">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map((item) => (
            <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
              <div className="relative w-24 h-24 bg-gray-100 rounded">
                {item.product.images[0] ? (
                  <Image 
                    src={item.product.images[0]} 
                    alt={item.product.name}
                    fill
                    className="object-cover rounded"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                    No Image
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{item.product.name}</h3>
                <p className="text-gray-600">${item.product.price}</p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity - 1 })}
                    disabled={item.quantity <= 1}
                    className="px-2 py-1 border rounded"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() => updateMutation.mutate({ itemId: item.id, quantity: item.quantity + 1 })}
                    disabled={item.quantity >= item.product.inventory.quantity}
                    className="px-2 py-1 border rounded"
                  >
                    +
                  </button>
                  <button
                    onClick={() => removeMutation.mutate(item.id)}
                    className="ml-4 text-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${cart.subtotal.toFixed(2)}</span>
            </div>
            {cart.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${cart.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => router.push('/checkout')}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}