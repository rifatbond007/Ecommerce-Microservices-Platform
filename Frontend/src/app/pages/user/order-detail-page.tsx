import { useParams, Link } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Separator } from '../../components/ui/separator';
import { orders } from '../../lib/mock-data';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  shipped: 'bg-purple-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
};

export function OrderDetailPage() {
  const { id } = useParams();
  const order = orders.find(o => o.id === id);

  if (!order) {
    return (
      <div className="text-center py-16">
        <h1 className="text-2xl font-bold mb-4">Order not found</h1>
        <Button asChild>
          <Link to="/account/orders">Back to Orders</Link>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <Button variant="ghost" asChild className="mb-6">
        <Link to="/account/orders">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Link>
      </Button>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{order.orderNumber}</h1>
          <p className="text-muted-foreground">
            Placed on {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
        <Badge className={statusColors[order.status]}>{order.status}</Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-20 w-20 rounded object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{item.productName}</p>
                    {item.variantDetails && (
                      <p className="text-sm text-muted-foreground">{item.variantDetails}</p>
                    )}
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)} each</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{order.shippingAddress.name}</p>
              <p className="text-sm">{order.shippingAddress.addressLine1}</p>
              {order.shippingAddress.addressLine2 && (
                <p className="text-sm">{order.shippingAddress.addressLine2}</p>
              )}
              <p className="text-sm">
                {order.shippingAddress.city}, {order.shippingAddress.state}{' '}
                {order.shippingAddress.zipCode}
              </p>
              <p className="text-sm text-muted-foreground">{order.shippingAddress.phone}</p>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${order.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{order.shipping === 0 ? 'FREE' : `$${order.shipping.toFixed(2)}`}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${order.total.toFixed(2)}</span>
              </div>

              <Separator />

              <div className="text-sm">
                <p className="text-muted-foreground">Payment Method</p>
                <p className="font-semibold">{order.paymentMethod}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
