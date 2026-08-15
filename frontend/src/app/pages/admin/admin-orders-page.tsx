import { useState, useEffect, useCallback } from 'react';
import { adminApi, getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Pagination } from '@/components/pagination';
import { ShoppingCart, Package, RefreshCw, X } from 'lucide-react';

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

export function AdminOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const limit = 20;

  const fetchOrders = useCallback(
    async (status?: string, p = 1) => {
      setLoading(true);
      setError('');
      try {
        const res = await adminApi.getOrders({
          status,
          page: p,
          limit,
        });
        const data = (res.data ?? {}) as { orders?: Order[]; total?: number };
        setOrders(data.orders ?? []);
        setTotal(data.total ?? (data.orders?.length ?? 0));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load orders'));
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchOrders(statusFilter || undefined, page);
  }, [fetchOrders, statusFilter, page]);

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? '' : value);
    setPage(1);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await adminApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast({ title: `Order ${newStatus}`, variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Update failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      await adminApi.cancelOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' } : o))
      );
      toast({ title: 'Order cancelled', variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Cancel failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  if (loading && orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Order Management</h1>
        <p className="text-muted-foreground mt-2">
          {total} order{total !== 1 ? 's' : ''} found
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              All Orders
            </CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {filterStatuses.slice(1).map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={() => fetchOrders(statusFilter || undefined, page)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No orders found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-sm font-medium">
                        #{order.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {order.user?.name ?? order.user?.email ?? 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {order.items?.length ?? 0} item{(order.items?.length ?? 0) !== 1 ? 's' : ''}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${order.total.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariantMap[order.status] || 'secondary'}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
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
                          {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleCancel(order.id)}
                              title="Cancel order"
                              className="text-destructive hover:text-destructive"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / limit))}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}