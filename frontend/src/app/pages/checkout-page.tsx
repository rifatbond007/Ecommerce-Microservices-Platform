import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cart-store';
import { userApi, orderApi, paymentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, CreditCard, CheckCheck, ChevronRight, ArrowLeft, Package, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Address {
  id: string; street: string; city: string; state: string; zip: string; country: string; isDefault?: boolean;
}

const steps = [
  { label: 'Cart Review', icon: ShoppingCart },
  { label: 'Shipping', icon: Truck },
  { label: 'Payment', icon: CreditCard },
  { label: 'Confirmation', icon: CheckCheck },
];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { items, getTotal } = useCartStore();
  const [step, setStep] = useState(1);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addressForm, setAddressForm] = useState({ street: '', city: '', state: '', zip: '', country: '' });
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);

  useEffect(() => {
    if (items.length === 0 && step < 4) navigate('/cart');
  }, [items, step, navigate]);

  useEffect(() => {
    if (step === 2) {
      const fetchAddresses = async () => {
        setLoadingAddresses(true);
        try {
          const { data } = await userApi.getAddresses();
          const list = data.addresses || data || [];
          setAddresses(list);
          if (list.length > 0 && !selectedAddressId) {
            const defaultAddr = list.find((a: Address) => a.isDefault);
            setSelectedAddressId(defaultAddr?.id || list[0].id);
          }
        } catch { setError('Failed to load addresses'); }
        finally { setLoadingAddresses(false); }
      };
      fetchAddresses();
    }
  }, [step]);

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await userApi.addAddress(addressForm);
      const newAddr = data.address || data;
      setAddresses(prev => [...prev, newAddr]);
      setSelectedAddressId(newAddr.id);
      setShowAddressForm(false);
      setAddressForm({ street: '', city: '', state: '', zip: '', country: '' });
    } catch { setError('Failed to add address'); }
    finally { setSubmitting(false); }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await orderApi.createOrder({
        cartId: items[0]?.cartId ?? '',
        addressId: selectedAddressId,
        notes: paymentMethod === 'cod' ? 'Pay on delivery' : undefined,
      });
      const id = data?.order?.id || data?.id || data?.orderId;
      if (!id) throw new Error('No order ID returned');
      await paymentApi.processPayment({ orderId: id, paymentMethod: 'card' });
      useCartStore.getState().clearCart();
      setOrderId(id);
      setStep(4);
    } catch (err: any) { setError(err.response?.data?.error?.message || 'Failed to place order'); }
    finally { setSubmitting(false); }
  };

  if (items.length === 0 && step < 4) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <Package className="h-16 w-16 mx-auto text-muted-foreground mb-6" />
      <h1 className="text-3xl font-bold mb-3">Nothing to checkout</h1>
      <p className="text-muted-foreground mb-8">Your cart is empty. Add some items first!</p>
      <Button onClick={() => navigate('/products')} className="rounded-full px-8">Continue Shopping</Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {steps.map((s, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2">
                <motion.div
                  animate={{ scale: isActive ? 1.1 : 1 }}
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                    isCompleted ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary text-primary-foreground ring-4 ring-primary/20' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? <CheckCheck className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </motion.div>
                <span className={cn('text-sm hidden sm:inline font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <motion.div
                  animate={{ backgroundColor: step > stepNum ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}
                  className="w-12 md:w-20 h-0.5 mx-2 rounded"
                />
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-destructive mb-4 p-4 bg-destructive/10 rounded-xl border border-destructive/20"
          >
            {error}
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Review Cart Items</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {items.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4"
                  >
                    <div className="w-16 h-16 bg-muted rounded-xl overflow-hidden flex-shrink-0">
                      {item.product?.images?.[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">img</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.product?.name || 'Product'}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                    </div>
                    <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>
            <div className="flex justify-between items-center">
              <Button variant="ghost" className="gap-2" onClick={() => navigate('/cart')}><ArrowLeft className="h-4 w-4" /> Back to Cart</Button>
              <div className="flex items-center gap-4">
                <span className="text-lg font-semibold">Total: <span className="text-primary">${getTotal().toFixed(2)}</span></span>
                <Button onClick={() => setStep(2)} className="rounded-full px-6 gap-2">
                  Continue <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {loadingAddresses ? (
                  <div className="text-center py-8 text-muted-foreground">Loading addresses...</div>
                ) : (
                  <>
                    <div className="grid gap-3">
                      {addresses.map(addr => (
                        <label key={addr.id} className={cn(
                          'flex items-start gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all hover:border-muted-foreground/30',
                          selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-muted/20'
                        )}>
                          <input type="radio" name="address" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="mt-1 accent-primary" />
                          <div>
                            <p className="font-medium">{addr.street}</p>
                            <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                            <p className="text-sm text-muted-foreground">{addr.country}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {addresses.length === 0 && <p className="text-center text-muted-foreground py-4">No addresses yet. Add one below.</p>}
                  </>
                )}
                {showAddressForm ? (
                  <form onSubmit={handleAddAddress} className="space-y-4 border-t pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Street</Label>
                      <Input id="street" value={addressForm.street} onChange={e => setAddressForm(s => ({ ...s, street: e.target.value }))} required className="rounded-xl" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input id="city" value={addressForm.city} onChange={e => setAddressForm(s => ({ ...s, city: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input id="state" value={addressForm.state} onChange={e => setAddressForm(s => ({ ...s, state: e.target.value }))} required className="rounded-xl" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input id="zip" value={addressForm.zip} onChange={e => setAddressForm(s => ({ ...s, zip: e.target.value }))} required className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input id="country" value={addressForm.country} onChange={e => setAddressForm(s => ({ ...s, country: e.target.value }))} required className="rounded-xl" />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" disabled={submitting} className="rounded-full">{submitting ? 'Saving...' : 'Save Address'}</Button>
                      <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)} className="rounded-full">Cancel</Button>
                    </div>
                  </form>
                ) : (
                  <Button variant="outline" onClick={() => setShowAddressForm(true)} className="rounded-full">+ Add New Address</Button>
                )}
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)} className="rounded-full gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={() => setStep(3)} disabled={!selectedAddressId} className="rounded-full px-6 gap-2">
                Continue <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {['card', 'stripe'].map(method => (
                  <label key={method} className={cn(
                    'flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all capitalize',
                    paymentMethod === method ? 'border-primary bg-primary/5' : 'border-muted/20 hover:border-muted-foreground/30'
                  )}>
                    <input type="radio" name="payment" value={method} checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} className="accent-primary" />
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{method === 'card' ? 'Credit Card' : 'Stripe'}</span>
                  </label>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between"><span className="text-muted-foreground">Items ({items.length})</span><span>${getTotal().toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-sm text-muted-foreground">Calculated at next step</span></div>
                <Separator />
                <div className="flex justify-between text-lg"><span className="font-semibold">Total</span><span className="font-bold text-primary">${getTotal().toFixed(2)}</span></div>
              </CardContent>
            </Card>
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(2)} className="rounded-full gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
              <Button onClick={handlePlaceOrder} disabled={submitting} className="rounded-full px-8 gap-2">
                {submitting ? (
                  <>Processing...</>
                ) : (
                  <>Place Order · ${getTotal().toFixed(2)}</>
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === 4 && orderId && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
              className="h-20 w-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6"
            >
              <CheckCheck className="h-10 w-10 text-success" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-4">Thank you for your purchase. Your order has been confirmed.</p>
            <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
              Order #{orderId.slice(0, 8)}
            </Badge>
            <div className="flex gap-3 justify-center">
              <Button onClick={() => navigate(`/orders/${orderId}`)} className="rounded-full">View Order</Button>
              <Button variant="outline" onClick={() => navigate('/products')} className="rounded-full">Continue Shopping</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
