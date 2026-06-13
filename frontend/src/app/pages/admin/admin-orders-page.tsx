import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package } from 'lucide-react';

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

const statusVariantMap: Record<string, 'warning' | 'default' | 'secondary' | 'success' | 'destructive'> = {
  pending: 'warning',
  confirmed: 'default',
  processing: 'secondary',
  shipped: 'secondary',
  delivered: 'success',
  cancelled: 'destructive',
};

const filterStatuses = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const transitionOptions = [
  { label: 'Confirm', value: 'confirmed' },
  { label: 'Ship', value: 'shipped' },
  { label: 'Deliver', value: 'delivered' },
  { label: 'Cancel', value: 'cancelled' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-56 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-24" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => fetchOrders()} className="rounded-full">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={rowVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground mt-1">{orders.length} order{orders.length !== 1 ? 's' : ''} found</p>
        </div>
      </motion.div>

      <motion.div variants={rowVariants}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                All Orders
              </CardTitle>
              <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Statuses</SelectItem>
                  {filterStatuses.slice(1).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No orders found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left bg-muted/30">
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Order ID</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Customer</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Items</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Total</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <motion.tr
                        key={order.id}
                        variants={rowVariants}
                        className="border-b last:border-0 transition-colors hover:bg-muted/20"
                      >
                        <td className="px-6 py-4 font-mono text-sm font-medium">
                          #{order.id.slice(0, 8)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {order.user?.name ?? order.user?.email ?? 'Unknown'}
                        </td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          ${order.total.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={statusVariantMap[order.status] || 'secondary'}>
                            {order.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-muted-foreground text-sm whitespace-nowrap">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <Select
                            onValueChange={(value) => handleStatusChange(order.id, value)}
                          >
                            <SelectTrigger className="h-8 w-36 text-xs">
                              <SelectValue placeholder="Change status..." />
                            </SelectTrigger>
                            <SelectContent>
                              {transitionOptions.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
