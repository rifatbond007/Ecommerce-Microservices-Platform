import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { orderApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, MapPin, ArrowLeft, Package, Truck, RotateCcw } from 'lucide-react';

interface OrderItem {
  id: string;
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

const statusBadgeVariant: Record<string, 'warning' | 'default' | 'secondary' | 'success' | 'destructive'> = {
  Pending: 'warning',
  Processing: 'default',
  Shipped: 'secondary',
  Delivered: 'success',
  Cancelled: 'destructive',
};

function OrderDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-4 w-32 mb-6" />
      <div className="flex items-center justify-between mb-6">
        <div><Skeleton className="h-9 w-48" /><Skeleton className="h-5 w-36 mt-2" /></div>
        <Skeleton className="h-7 w-24 rounded-full" />
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <Card><CardHeader><Skeleton className="h-6 w-16" /></CardHeader><CardContent className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-16 w-16 rounded-xl shrink-0" />
                <div className="flex-1 space-y-1"><Skeleton className="h-4 w-40" /><Skeleton className="h-3 w-28" /></div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-40" /></CardHeader><CardContent><Skeleton className="h-4 w-48" /><Skeleton className="h-4 w-36 mt-1" /></CardContent></Card>
          <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-40" /><Skeleton className="h-4 w-40" /></CardContent></Card>
        </div>
        <div className="space-y-4">
          <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-full" /><Skeleton className="h-5 w-full" /></CardContent></Card>
        </div>
      </div>
    </div>
  );
}

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
  const [returnItemId, setReturnItemId] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(1);

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

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const handleReturn = useCallback(async () => {
    if (!returnItemId) {
      setReturnError('Please select an item to return');
      return;
    }
    if (!returnReason.trim()) {
      setReturnError('Please provide a reason for return');
      return;
    }
    setReturning(true);
    setReturnError('');
    setReturnSuccess('');
    try {
      await orderApi.requestReturn(id!, {
        orderItemId: returnItemId,
        quantity: returnQuantity,
        reason: returnReason,
      });
      setReturnSuccess('Return request submitted successfully');
      setReturnDialogOpen(false);
    } catch {
      setReturnError('Failed to submit return request');
    } finally {
      setReturning(false);
    }
  }, [id, returnItemId, returnQuantity, returnReason]);

  if (loading) return <OrderDetailSkeleton />;

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
        <Link to="/orders" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Order not found</h3>
          <p className="text-muted-foreground mb-6">This order may have been removed or doesn't exist.</p>
          <Link to="/orders">
            <Button variant="outline" className="rounded-full gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <Link to="/orders" className="text-sm text-muted-foreground hover:text-primary transition-colors mb-6 inline-flex items-center gap-1.5 group">
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
        Back to Orders
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-3xl font-bold">Order #{order.id.slice(0, 8)}</h1>
          <p className="text-muted-foreground mt-1">
            {new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Badge variant={statusBadgeVariant[order.status] || 'secondary'} className="capitalize text-sm px-4 py-1.5 rounded-full w-fit">
          {order.status}
        </Badge>
      </motion.div>

      {returnSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-green-600 mb-4 p-4 rounded-xl bg-green-50 border border-green-200"
        >
          <span className="text-sm font-medium">{returnSuccess}</span>
        </motion.div>
      )}

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid md:grid-cols-3 gap-6"
      >
        <div className="md:col-span-2 space-y-4">
          <motion.div variants={item}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-5 w-5 text-primary" />
                  Items ({order.items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                {order.items.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors group"
                  >
                    <div className="w-16 h-16 bg-muted rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden group-hover:scale-105 transition-transform duration-300">
                      {item.product.images[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded-xl" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/products/${item.product.id}`} className="font-medium hover:text-primary transition-colors truncate block">
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-0.5">Qty: {item.quantity} × ${item.price.toFixed(2)}</p>
                    </div>
                    <p className="font-semibold text-lg">${(item.price * item.quantity).toFixed(2)}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {order.shippingAddress && (
            <motion.div variants={item}>
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="h-5 w-5 text-primary" />
                    Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.shippingAddress.street}</p>
                      <p className="text-muted-foreground text-sm">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-muted-foreground text-sm">{order.shippingAddress.country}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {order.payment && (
            <motion.div variants={item}>
              <Card className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Payment Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Method</span>
                    <span className="font-medium capitalize">{order.payment.method}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b pb-2">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant={order.payment.status === 'completed' ? 'success' : 'warning'} className="capitalize">
                      {order.payment.status}
                    </Badge>
                  </div>
                  {order.payment.transactionId && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Transaction ID</span>
                      <span className="font-mono text-xs">{order.payment.transactionId}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        <div className="space-y-4">
          <motion.div variants={item}>
            <Card className="overflow-hidden">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${(order.subtotal || order.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>{order.shipping ? `$${order.shipping.toFixed(2)}` : <Badge variant="success" className="text-[10px] px-1.5 py-0">FREE</Badge>}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-3">
                  <span>Total</span>
                  <span className="text-primary">${order.total.toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {order.status === 'Delivered' && (
            <motion.div variants={item}>
              <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full gap-2 rounded-xl h-12">
                    <RotateCcw className="h-4 w-4" />
                    Request Return
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <RotateCcw className="h-5 w-5" />
                      Request Return
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="returnItem">Item to return</Label>
                      <select
                        id="returnItem"
                        value={returnItemId}
                        onChange={e => {
                          setReturnItemId(e.target.value);
                          const item = order.items.find(i => i.id === e.target.value);
                          if (item) setReturnQuantity(1);
                        }}
                        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">Select an item...</option>
                        {order.items.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.product.name} (Qty: {item.quantity})
                          </option>
                        ))}
                      </select>
                    </div>
                    {returnItemId && (() => {
                      const item = order.items.find(i => i.id === returnItemId);
                      if (!item) return null;
                      return (
                        <div className="space-y-2">
                          <Label htmlFor="returnQty">Quantity</Label>
                          <Input
                            id="returnQty"
                            type="number"
                            min={1}
                            max={item.quantity}
                            value={returnQuantity}
                            onChange={e => setReturnQuantity(Math.max(1, Math.min(item.quantity, parseInt(e.target.value) || 1)))}
                          />
                        </div>
                      );
                    })()}
                    <div className="space-y-2">
                      <Label htmlFor="returnReason">Reason for return</Label>
                      <Input
                        id="returnReason"
                        value={returnReason}
                        onChange={e => setReturnReason(e.target.value)}
                        placeholder="Describe why you want to return this order..."
                      />
                    </div>
                    {returnError && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-xl"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0" />
                        <span>{returnError}</span>
                      </motion.div>
                    )}
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setReturnDialogOpen(false)} className="rounded-full">Cancel</Button>
                    <Button onClick={handleReturn} disabled={returning} className="rounded-full gap-2">
                      {returning ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      ) : null}
                      {returning ? 'Submitting...' : 'Submit'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
