'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface Cart {
  id: string;
  items: { id: string; quantity: number; product: { id: string; name: string; price: number } }[];
  total: number;
}

interface Address {
  id: string;
  label: string;
  fullName: string;
  addressLine1: string;
  city: string;
  state: string;
  postalCode: string;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.get<{ success: boolean; data: Cart }>('/cart'),
  });

  const { data: addressesData, isLoading: addressesLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => api.get<{ success: boolean; data: Address[] }>('/users/addresses'),
  });

  const createOrderMutation = useMutation({
    mutationFn: () => api.post<{ success: boolean; data: { orderId: string } }>('/orders', {
      addressId: selectedAddressId,
      paymentMethod,
    }),
    onSuccess: (data) => {
      if (data.success && data.data?.orderId) {
        router.push(`/orders/${data.data.orderId}`);
      }
    },
  });

  if (cartLoading || addressesLoading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  const cart = cartData?.data;
  const addresses = addressesData?.data || [];

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            {addresses.length === 0 ? (
              <p className="text-gray-500">
                No addresses. <a href="/addresses" className="text-blue-600">Add one</a>
              </p>
            ) : (
              <div className="space-y-2">
                {addresses.map((addr) => (
                  <label key={addr.id} className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="address"
                      value={addr.id}
                      checked={selectedAddressId === addr.id}
                      onChange={(e) => setSelectedAddressId(e.target.value)}
                      className="w-4 h-4"
                    />
                    <div>
                      <p className="font-medium">{addr.fullName}</p>
                      <p className="text-sm text-gray-600">
                        {addr.addressLine1}, {addr.city}, {addr.state} {addr.postalCode}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4"
                />
                <span>Credit/Debit Card</span>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4"
                />
                <span>PayPal</span>
              </label>
            </div>
          </div>

          <div className="border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Order Items</h2>
            <div className="space-y-3">
              {cart.items.map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span>{item.product.name} x {item.quantity}</span>
                  <span>${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Order Summary</h2>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span>Free</span>
            </div>
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total</span>
              <span>${cart.total.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={() => createOrderMutation.mutate()}
            disabled={!selectedAddressId || createOrderMutation.isPending}
            className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
          </button>
        </div>
      </div>
    </div>
  );
}