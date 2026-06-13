import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '@/store/cart-store';
import { userApi, orderApi, paymentApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, MapPin, CreditCard, CheckCheck, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  isDefault?: boolean;
}

const steps = [
  { label: 'Cart', icon: ShoppingCart },
  { label: 'Shipping', icon: MapPin },
  { label: 'Payment', icon: CreditCard },
  { label: 'Confirm', icon: CheckCheck },
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
    if (items.length === 0 && step < 4) {
      navigate('/cart');
    }
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
        } catch {
          setError('Failed to load addresses');
        } finally {
          setLoadingAddresses(false);
        }
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
    } catch {
      setError('Failed to add address');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await orderApi.createOrder({
        items: items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.unitPrice,
        })),
        shippingAddressId: selectedAddressId,
        paymentMethod,
      });
      const id = data?.order?.id || data?.id || data?.orderId;
      if (!id) throw new Error('No order ID returned');
      await paymentApi.processPayment({ orderId: id, paymentMethod: 'card' });
      useCartStore.getState().clearCart();
      setOrderId(id);
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0 && step < 4) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Checkout</h1>
        <p className="text-muted-foreground mb-6">Your cart is empty</p>
        <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Checkout</h1>
      <div className="flex items-center justify-center gap-0 mb-8">
        {steps.map((s, i) => {
          const stepNum = i + 1;
          const isActive = step === stepNum;
          const isCompleted = step > stepNum;
          return (
            <div key={i} className="flex items-center">
              <div className="flex items-center gap-2">
                <div className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted ? 'bg-primary text-primary-foreground' : isActive ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2' : 'bg-muted text-muted-foreground'
                )}>
                  {isCompleted ? <CheckCheck className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
                </div>
                <span className={cn('text-sm hidden sm:inline', isActive ? 'font-medium text-foreground' : 'text-muted-foreground')}>{s.label}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('w-12 h-px mx-2', step > stepNum ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          );
        })}
      </div>
      {error && <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded">{error}</div>}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Review Cart Items</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center text-muted-foreground text-xs">
                    {item.product?.images?.[0] ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover rounded" /> : 'img'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.product?.name || 'Product'}</p>
                     <p className="text-sm text-muted-foreground">Qty: {item.quantity} × ${item.unitPrice.toFixed(2)}</p>
                  </div>
                  <p className="font-semibold">${item.totalPrice.toFixed(2)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
          <div className="flex justify-between items-center">
            <p className="text-lg font-semibold">Total: ${getTotal().toFixed(2)}</p>
            <Button onClick={() => setStep(2)}>Continue to Shipping <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Shipping Address</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {loadingAddresses ? (
                <p className="text-center text-muted-foreground py-4">Loading addresses...</p>
              ) : (
                <>
                  {addresses.map(addr => (
                    <label key={addr.id} className={cn(
                      'flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors',
                      selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'border-input hover:border-muted-foreground'
                    )}>
                      <input
                        type="radio"
                        name="address"
                        value={addr.id}
                        checked={selectedAddressId === addr.id}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1"
                      />
                      <div>
                        <p className="font-medium">{addr.street}</p>
                        <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zip}</p>
                        <p className="text-sm text-muted-foreground">{addr.country}</p>
                      </div>
                    </label>
                  ))}
                  {addresses.length === 0 && <p className="text-center text-muted-foreground py-4">No addresses found. Add one below.</p>}
                </>
              )}
              {showAddressForm ? (
                <form onSubmit={handleAddAddress} className="space-y-4 border-t pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street</Label>
                    <Input id="street" value={addressForm.street} onChange={e => setAddressForm({ ...addressForm, street: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input id="city" value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input id="state" value={addressForm.state} onChange={e => setAddressForm({ ...addressForm, state: e.target.value })} required />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="zip">ZIP Code</Label>
                      <Input id="zip" value={addressForm.zip} onChange={e => setAddressForm({ ...addressForm, zip: e.target.value })} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      <Input id="country" value={addressForm.country} onChange={e => setAddressForm({ ...addressForm, country: e.target.value })} required />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={submitting}>{submitting ? 'Saving...' : 'Save Address'}</Button>
                    <Button type="button" variant="outline" onClick={() => setShowAddressForm(false)}>Cancel</Button>
                  </div>
                </form>
              ) : (
                <Button variant="outline" onClick={() => setShowAddressForm(true)}>Add New Address</Button>
              )}
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Back to Cart</Button>
            <Button onClick={() => setStep(3)} disabled={!selectedAddressId}>Continue to Payment <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Payment Method</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {['card', 'stripe'].map(method => (
                <label key={method} className={cn(
                  'flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors capitalize',
                  paymentMethod === method ? 'border-primary bg-primary/5' : 'border-input hover:border-muted-foreground'
                )}>
                  <input
                    type="radio"
                    name="payment"
                    value={method}
                    checked={paymentMethod === method}
                    onChange={() => setPaymentMethod(method)}
                  />
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">{method === 'card' ? 'Credit Card' : 'Stripe'}</span>
                </label>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2"><span>Items ({items.length})</span><span>${getTotal().toFixed(2)}</span></div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2"><span>Total</span><span>${getTotal().toFixed(2)}</span></div>
            </CardContent>
          </Card>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(2)}>Back to Shipping</Button>
            <Button onClick={handlePlaceOrder} disabled={submitting}>
              {submitting ? 'Processing...' : 'Place Order'}
            </Button>
          </div>
        </div>
      )}
      {step === 4 && orderId && (
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><CheckCheck className="h-6 w-6 text-green-500" /> Order Placed!</CardTitle></CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-lg mb-2">Your order has been placed successfully.</p>
            <p className="text-muted-foreground mb-6">Order ID: <span className="font-mono font-medium">{orderId}</span></p>
            <Button onClick={() => navigate(`/orders/${orderId}`)}>View Order Details</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
