import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: { name: string };
}

interface Order {
  id: string;
  user: { id: string; name: string; email: string };
  items: OrderItem[];
  total: number;
  status: string;
  createdAt: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-indigo-100 text-indigo-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const filterStatuses = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const transitionOptions = [
  { label: 'Confirm', value: 'confirmed' },
  { label: 'Ship', value: 'shipped' },
  { label: 'Deliver', value: 'delivered' },
  { label: 'Cancel', value: 'cancelled' },
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async (status?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = status ? { status } : undefined;
      const res = await adminApi.getOrders(params);
      setOrders(res.data.orders || []);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    fetchOrders(value || undefined);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => fetchOrders()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Orders</CardTitle>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">All Statuses</option>
              {filterStatuses.slice(1).map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {orders.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Order ID</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Customer</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Items</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Total</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Date</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b last:border-0">
                      <td className="py-3 pr-4 font-mono text-sm">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="py-3 pr-4">
                        {order.user?.name ?? order.user?.email ?? 'Unknown'}
                      </td>
                      <td className="py-3 pr-4">{order.items?.length ?? 0}</td>
                      <td className="py-3 pr-4 font-medium">
                        ${order.total.toFixed(2)}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium capitalize',
                            statusColors[order.status] || 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-muted-foreground text-sm">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            if (e.target.value) {
                              handleStatusChange(order.id, e.target.value);
                            }
                            e.target.value = '';
                          }}
                          className="h-8 rounded border border-input bg-background px-2 text-xs"
                        >
                          <option value="" disabled>
                            Change status...
                          </option>
                          {transitionOptions.map((t) => (
                            <option key={t.value} value={t.value}>
                              {t.label}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
