import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { useCartStore } from '../../store/cart-store';
import { useAuthStore } from '../../store/auth-store';
import { addresses } from '../../lib/mock-data';
import { toast } from 'sonner';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, getSubtotal, getTax, getShipping, getTotal, clearCart } = useCartStore();
  const [selectedAddress, setSelectedAddress] = useState(addresses[0]?.id || '');
  const [paymentMethod, setPaymentMethod] = useState('credit-card');

  const userAddresses = addresses.filter(a => a.userId === user?.id);

  const handlePlaceOrder = () => {
    // Mock order placement
    toast.success('Order placed successfully!');
    clearCart();
    navigate('/account/orders');
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_400px]">
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  1
                </div>
                Shipping Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {userAddresses.length > 0 ? (
                <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                  <div className="space-y-4">
                    {userAddresses.map((address) => (
                      <div key={address.id} className="flex items-start space-x-3">
                        <RadioGroupItem value={address.id} id={address.id} />
                        <Label htmlFor={address.id} className="flex-1 cursor-pointer">
                          <div className="rounded-lg border p-4">
                            <p className="font-semibold">{address.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {address.addressLine1}
                              {address.addressLine2 && `, ${address.addressLine2}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {address.city}, {address.state} {address.zipCode}
                            </p>
                            <p className="text-sm text-muted-foreground">{address.phone}</p>
                          </div>
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No saved addresses</p>
                  <Button>Add New Address</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  2
                </div>
                Payment Method
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="credit-card" id="credit-card" />
                    <Label htmlFor="credit-card" className="cursor-pointer">
                      Credit/Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="paypal" id="paypal" />
                    <Label htmlFor="paypal" className="cursor-pointer">
                      PayPal
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem value="cash" id="cash" />
                    <Label htmlFor="cash" className="cursor-pointer">
                      Cash on Delivery
                    </Label>
                  </div>
                </div>
              </RadioGroup>
              <p className="mt-4 text-sm text-muted-foreground">
                Payment integration is for demo purposes only
              </p>
            </CardContent>
          </Card>

          {/* Order Review */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  3
                </div>
                Review Order
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      className="h-16 w-16 rounded object-cover"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{item.productName}</p>
                      {item.variantDetails && (
                        <p className="text-sm text-muted-foreground">{item.variantDetails}</p>
                      )}
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${getSubtotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${getTax().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>{getShipping() === 0 ? 'FREE' : `$${getShipping().toFixed(2)}`}</span>
                </div>
              </div>

              <Separator />

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>${getTotal().toFixed(2)}</span>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handlePlaceOrder}
                disabled={!selectedAddress || items.length === 0}
              >
                <Check className="mr-2 h-5 w-5" />
                Place Order
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By placing your order, you agree to our terms and conditions
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
