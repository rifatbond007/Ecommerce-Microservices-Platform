import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Minus, Plus, Trash2 } from 'lucide-react';

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateItem, removeItem, clearCart, getTotal } = useCartStore();

  if (items.length === 0) return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Your Cart</h1>
      <p className="text-muted-foreground mb-6">Your cart is empty</p>
      <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Your Cart</h1>
        <Button variant="outline" onClick={clearCart}>Clear Cart</Button>
      </div>
      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="w-20 h-20 bg-muted rounded flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">{item.product?.images?.[0] ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" /> : 'No img'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.product?.name || 'Product'}</p>
                   <p className="text-sm text-muted-foreground">${item.unitPrice} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => updateItem(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus className="h-4 w-4" /></Button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <Button variant="outline" size="icon" onClick={() => updateItem(item.id, item.quantity + 1)}><Plus className="h-4 w-4" /></Button>
                </div>
                <p className="font-semibold w-20 text-right">${item.totalPrice.toFixed(2)}</p>
                <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <div>
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-between mb-4"><span>Subtotal</span><span className="font-semibold">${getTotal().toFixed(2)}</span></div>
               <Button className="w-full" size="lg" onClick={() => navigate('/checkout')}>Checkout</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
