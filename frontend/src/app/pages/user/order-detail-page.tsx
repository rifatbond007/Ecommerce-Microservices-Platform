import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { orderApi, api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, AlertCircle, CreditCard, MapPin, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderItem {
  product: { id: string; name: string; images: string[]; price: number };
  quantity: number;
  price: number;
}

interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

interface Payment {
  method: string;
  status: string;
  transactionId?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  subtotal: number;
  shipping: number;
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: ShippingAddress;
  payment?: Payment;
}

const statusColors: Record<string, string> = {
  Pending: 'bg-yellow-100 text-yellow-800',
  Processing: 'bg-blue-100 text-blue-800',
  Shipped: 'bg-purple-100 text-purple-800',
  Delivered: 'bg-green-100 text-green-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [returnReason, setReturnReason] = useState('');
  const [returning, setReturning] = useState(false);
  const [returnError, setReturnError] = useState('');
  const [returnSuccess, setReturnSuccess] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const r = await orderApi.getOrder(id);
      setOrder(r.data.order || r.data);
    } catch {
      setError('Failed to load order');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const handleReturn = useCallback(async () => {
    if (!returnReason.trim()) {
      setReturnError('Please provide a reason for return');
      return;
    }
    setReturning(true);
    setReturnError('');
    setReturnSuccess('');
    try {
      await api.post(`/orders/${id}/return`, { reason: returnReason });
      setReturnSuccess('Return request submitted successfully');
      setReturnDialogOpen(false);
    } catch {
      setReturnError('Failed to submit return request');
    } finally {
      setReturning(false);
    }
  }, [id, returnReason]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
        <Link to="/orders" className="text-sm text-primary hover:underline">Back to Orders</Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground mb-4">Order not found</p>
        <Link to="/orders" className="text-sm text-primary hover:underline">Back to Orders</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/orders" className="text-sm text-primary hover:underline mb-4 inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={cn('capitalize px-3 py-1 rounded-full text-sm font-medium', statusColors[order.status] || 'bg-gray-100')}>
          {order.status}
        </span>
      </div>

      {returnSuccess && (
        <div className="flex items-center gap-2 text-green-600 mb-4 p-3 rounded-md bg-green-50">
          <span className="text-sm">{returnSuccess}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs overflow-hidden">
                    {item.product.images[0] ? (
                      <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      'No img'
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.id}`} className="font-medium hover:underline truncate block">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p>{order.shippingAddress.street}</p>
                <p className="text-muted-foreground text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
                <p className="text-muted-foreground text-sm">{order.shippingAddress.country}</p>
              </CardContent>
            </Card>
          )}

          {order.payment && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm">
                  Method: <span className="font-medium capitalize">{order.payment.method}</span>
                </p>
                <p className="text-sm">
                  Status: <span className={cn('font-medium capitalize', order.payment.status === 'completed' ? 'text-green-600' : '')}>
                    {order.payment.status}
                  </span>
                </p>
                {order.payment.transactionId && (
                  <p className="text-sm text-muted-foreground">Transaction ID: {order.payment.transactionId}</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>${(order.subtotal || order.total).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{order.shipping ? `$${order.shipping.toFixed(2)}` : 'Free'}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {order.status === 'Delivered' && (
            <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">Request Return</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Return</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Reason for return</Label>
                    <Input
                      value={returnReason}
                      onChange={e => setReturnReason(e.target.value)}
                      placeholder="Describe why you want to return this order..."
                    />
                  </div>
                  {returnError && (
                    <div className="flex items-center gap-2 text-destructive text-sm">
                      <AlertCircle className="h-4 w-4" />
                      <span>{returnError}</span>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setReturnDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleReturn} disabled={returning}>
                    {returning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {returning ? 'Submitting...' : 'Submit'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  );
}
