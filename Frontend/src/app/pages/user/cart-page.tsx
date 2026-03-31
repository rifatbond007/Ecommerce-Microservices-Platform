import { Link } from 'react-router';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Separator } from '../../components/ui/separator';
import { Input } from '../../components/ui/input';
import { useCartStore } from '../../store/cart-store';
import { useState } from 'react';
import { toast } from 'sonner';

export function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    applyCoupon,
    removeCoupon,
    couponCode,
    discount,
    getSubtotal,
    getTax,
    getShipping,
    getTotal,
  } = useCartStore();

  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = () => {
    if (applyCoupon(couponInput)) {
      toast.success('Coupon applied!');
      setCouponInput('');
    } else {
      toast.error('Invalid coupon code');
    }
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const shipping = getShipping();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <ShoppingBag className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-2xl font-bold">Your cart is empty</h2>
            <p className="mb-6 text-muted-foreground">
              Start shopping to add items to your cart
            </p>
            <Button asChild>
              <Link to="/products">Continue Shopping</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Shopping Cart</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        {/* Cart Items */}
        <div className="space-y-4">
          {items.map((item) => (
            <Card key={`${item.productId}-${item.variantId || ''}`}>
              <CardContent className="p-6">
                <div className="flex gap-4">
                  <img
                    src={item.productImage}
                    alt={item.productName}
                    className="h-24 w-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link
                          to={`/products/${item.productId}`}
                          className="font-semibold hover:underline"
                        >
                          {item.productName}
                        </Link>
                        {item.variantDetails && (
                          <p className="text-sm text-muted-foreground">
                            {item.variantDetails}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeItem(item.productId, item.variantId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.variantId
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center">{item.quantity}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.variantId
                            )
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${item.price.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-6 text-xl font-bold">Order Summary</h2>

              {/* Coupon Code */}
              <div className="mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    disabled={!!couponCode}
                  />
                  {couponCode ? (
                    <Button onClick={removeCoupon} variant="outline">
                      Remove
                    </Button>
                  ) : (
                    <Button onClick={handleApplyCoupon}>Apply</Button>
                  )}
                </div>
                {couponCode && (
                  <p className="mt-2 text-sm text-green-600">
                    Coupon "{couponCode}" applied ({discount}% off)
                  </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">
                  Try: SAVE10, SAVE20, or SPRING25
                </p>
              </div>

              <Separator className="mb-6" />

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({discount}%)</span>
                    <span>-${((subtotal * discount) / 100).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tax (9%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}</span>
                </div>
                {subtotal < 50 && (
                  <p className="text-sm text-muted-foreground">
                    Add ${(50 - subtotal).toFixed(2)} more for free shipping
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="mb-6 flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>

              <Button asChild className="w-full" size="lg">
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>

              <Button asChild variant="outline" className="mt-2 w-full">
                <Link to="/products">Continue Shopping</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
