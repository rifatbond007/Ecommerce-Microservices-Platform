import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from 'lucide-react';

export function CartPage() {
  const navigate = useNavigate();
  const { items, updateItem, removeItem, clearCart, getTotal } = useCartStore();

  if (items.length === 0) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md mx-auto"
      >
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
        <h1 className="text-3xl font-bold mb-3">Your cart is empty</h1>
        <p className="text-muted-foreground mb-8">Looks like you haven't added anything yet. Start shopping to fill it up!</p>
        <Button size="lg" className="rounded-full px-8" onClick={() => navigate('/products')}>
          Continue Shopping
        </Button>
      </motion.div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="text-muted-foreground mt-1">{items.length} {items.length === 1 ? 'item' : 'items'} in your cart</p>
        </div>
        <Button variant="outline" onClick={clearCart} className="rounded-full text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4 mr-2" /> Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="overflow-hidden border-0 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="w-20 h-20 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product?.name || 'Product'}</p>
                      <p className="text-sm text-muted-foreground">${item.unitPrice} each</p>
                    </div>
                    <div className="flex items-center gap-1 border rounded-full">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateItem(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => updateItem(item.id, item.quantity + 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold w-20 text-right">${item.totalPrice.toFixed(2)}</p>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => removeItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          <Button variant="ghost" className="gap-2" onClick={() => navigate('/products')}>
            <ArrowLeft className="h-4 w-4" /> Continue Shopping
          </Button>
        </div>

        <div>
          <Card className="sticky top-24 border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${getTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span className="font-medium">Calculated at checkout</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">Total</span>
                <span className="font-bold text-primary">${getTotal().toFixed(2)}</span>
              </div>
              <Button className="w-full rounded-full h-12 text-base gap-2" size="lg" onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
