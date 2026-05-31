import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Order { id: string; status: string; total: number; subtotal: number; shipping: number; createdAt: string; items: { product: { name: string; images: string[]; price: number }; quantity: number; price: number }[]; shippingAddress?: any; payment?: any }

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    orderApi.getOrder(id).then(r => setOrder(r.data.order || r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  if (!order) return <div className="container mx-auto px-4 py-8 text-center">Order not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/orders" className="text-sm text-primary hover:underline mb-4 block">&larr; Back to Orders</Link>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
        <span className="capitalize px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">{order.status}</span>
      </div>
      <p className="text-muted-foreground mb-6">{new Date(order.createdAt).toLocaleDateString()}</p>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader><CardTitle>Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">{item.product.images[0] ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" /> : 'img'}</div>
                  <div className="flex-1"><p className="font-medium">{item.product.name}</p><p className="text-sm text-muted-foreground">Qty: {item.quantity}</p></div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between"><span>Subtotal</span><span>${order.subtotal?.toFixed(2) || order.total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Shipping</span><span>{order.shipping ? `$${order.shipping.toFixed(2)}` : 'Free'}</span></div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total</span><span>${order.total.toFixed(2)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
