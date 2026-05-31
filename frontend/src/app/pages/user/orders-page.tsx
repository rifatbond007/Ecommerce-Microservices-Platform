import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Order { id: string; status: string; total: number; createdAt: string; items: { product: { name: string; images: string[] }; quantity: number; price: number }[] }

export function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderApi.getOrders().then(r => setOrders(r.data.orders || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Orders</h1>
      {orders.length === 0 ? (
        <div className="text-center py-16"><p className="text-muted-foreground mb-4">No orders yet</p><Button onClick={() => window.location.href = '/products'}>Start Shopping</Button></div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div><p className="font-medium">Order #{order.id.slice(0, 8)}</p><p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p></div>
                  <div className="text-right"><p className="font-semibold">${order.total.toFixed(2)}</p><span className="text-sm capitalize px-2 py-1 rounded-full bg-primary/10 text-primary">{order.status}</span></div>
                </div>
                <Link to={`/orders/${order.id}`}><Button variant="outline" size="sm">View Details</Button></Link>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
