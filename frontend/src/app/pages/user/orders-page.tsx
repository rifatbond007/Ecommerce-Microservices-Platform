import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

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

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>

      {error && (
        <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {STATUSES.map(s => (
          <Button
            key={s}
            variant={activeStatus === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveStatus(s)}
            className="whitespace-nowrap"
          >
            {s}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">
            {activeStatus === 'All' ? 'No orders yet' : `No ${activeStatus.toLowerCase()} orders`}
          </p>
          {activeStatus === 'All' && (
            <Button onClick={() => navigate('/products')}>Start Shopping</Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(order => {
            const firstItem = order.items[0];
            return (
              <Link key={order.id} to={`/orders/${order.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs overflow-hidden">
                        {firstItem?.product.images[0] ? (
                          <img src={firstItem.product.images[0]} alt={firstItem.product.name} className="w-full h-full object-cover" />
                        ) : (
                          'No img'
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="font-medium text-sm">Order #{order.id.slice(0, 8)}</p>
                          <span className={cn('text-xs font-medium px-2 py-0.5 rounded-full capitalize', statusColors[order.status] || 'bg-gray-100')}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold">${order.total.toFixed(2)}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
