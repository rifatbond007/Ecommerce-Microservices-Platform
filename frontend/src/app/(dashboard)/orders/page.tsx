'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  createdAt: string;
  itemCount: number;
}

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.get<{ success: boolean; data: Order[] }>('/orders'),
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  const orders = data?.data || [];

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">No orders yet</h1>
        <Link href="/products" className="text-blue-600 hover:underline">
          Start Shopping
        </Link>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PROCESSING: 'bg-blue-100 text-blue-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-sm text-gray-500">Order #{order.orderNumber}</p>
                <p className="text-lg font-semibold">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(order.status)}`}>
                {order.status}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-gray-600">{order.itemCount} items</p>
              <p className="text-xl font-bold">${order.total.toFixed(2)}</p>
            </div>
            <Link 
              href={`/orders/${order.id}`} 
              className="mt-4 inline-block text-blue-600 hover:underline"
            >
              View Details
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}