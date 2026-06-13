import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { orderApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShoppingBag, Package, ChevronRight } from 'lucide-react';

interface OrderItem {
  product: { name: string; images: string[] };
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: OrderItem[];
}

const STATUSES = ['All', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

const statusBadgeVariant: Record<string, 'warning' | 'default' | 'secondary' | 'success' | 'destructive'> = {
  Pending: 'warning',
  Processing: 'default',
  Shipped: 'secondary',
  Delivered: 'success',
  Cancelled: 'destructive',
};

function OrdersSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-40 mb-6" />
      <div className="flex gap-2 mb-6">
        {STATUSES.map(s => <Skeleton key={s} className="h-9 w-20 rounded-full" />)}
      </div>
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeStatus, setActiveStatus] = useState<string>('All');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await orderApi.getOrders();
      setOrders(r.data.orders || []);
    } catch {
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = activeStatus === 'All'
    ? orders
    : orders.filter(o => o.status === activeStatus);

  if (loading) return <OrdersSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none">
        {STATUSES.map(s => (
          <motion.div key={s} whileTap={{ scale: 0.95 }}>
            <Button
              variant={activeStatus === s ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveStatus(s)}
              className="whitespace-nowrap rounded-full transition-all"
            >
              {s}
            </Button>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            {activeStatus === 'All' ? (
              <Package className="h-8 w-8 text-muted-foreground" />
            ) : (
              <ShoppingBag className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {activeStatus === 'All' ? 'No orders yet' : `No ${activeStatus.toLowerCase()} orders`}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            {activeStatus === 'All'
              ? 'Start exploring our products and place your first order today.'
              : `You don\'t have any orders with ${activeStatus.toLowerCase()} status.`}
          </p>
          {activeStatus === 'All' && (
            <Button onClick={() => navigate('/products')} size="lg" className="rounded-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              Start Shopping
            </Button>
          )}
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStatus}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {filtered.map((order, index) => {
              const firstItem = order.items[0];
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Link to={`/orders/${order.id}`} className="block group">
                    <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                            {firstItem?.product.images[0] ? (
                              <img src={firstItem.product.images[0]} alt={firstItem.product.name} className="w-full h-full object-cover" />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm truncate">Order #{order.id.slice(0, 8)}</p>
                              <Badge variant={statusBadgeVariant[order.status] || 'secondary'} className="capitalize shrink-0 ml-2">
                                {order.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p className="text-sm text-muted-foreground mt-1.5">
                              {order.items.length} item{order.items.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0 hidden sm:block">
                            <p className="font-semibold text-lg">${order.total.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground mt-1 group-hover:text-primary transition-colors flex items-center gap-1 justify-end">
                              View Details <ChevronRight className="h-3 w-3" />
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
