import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Pencil, Trash2, Plus, AlertCircle, MapPin, Home, Building } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface AddressForm {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

const emptyForm: AddressForm = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  isDefault: false,
};

function AddressesSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        {[1, 2].map(i => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-36" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-16 rounded-full mt-2" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await userApi.getAddresses();
      setAddresses(r.data.addresses || []);
    } catch {
      setError('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = useCallback(() => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((addr: Address) => {
    setEditingId(addr.id);
    setForm({
      street: addr.street,
      city: addr.city,
      state: addr.state,
      zipCode: addr.zipCode,
      country: addr.country,
      isDefault: addr.isDefault,
    });
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      if (editingId) {
        await userApi.updateAddress(editingId, form);
      } else {
        await userApi.addAddress(form);
      }
      setDialogOpen(false);
      await load();
    } catch {
      setError('Failed to save address');
    } finally {
      setSaving(false);
    }
  }, [editingId, form, load]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Delete this address?')) return;
    setDeleting(id);
    try {
      await userApi.deleteAddress(id);
      await load();
    } catch {
      setError('Failed to delete address');
    } finally {
      setDeleting(null);
    }
  }, [load]);

  if (loading) return <AddressesSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd} className="rounded-full gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {editingId ? (
                  <><Pencil className="h-5 w-5" /> Edit Address</>
                ) : (
                  <><Plus className="h-5 w-5" /> Add Address</>
                )}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="street">Street</Label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="street" value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} className="pl-10" placeholder="123 Main St" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="New York" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input id="state" value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} placeholder="NY" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input id="zipCode" value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} placeholder="10001" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} placeholder="United States" />
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <label htmlFor="isDefault" className="text-sm font-medium leading-none cursor-pointer">Set as default address</label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-full">Cancel</Button>
              <Button onClick={handleSave} disabled={saving} className="rounded-full gap-2">
                {saving ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                ) : null}
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {addresses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <MapPin className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Add a shipping address to make checkout faster and easier.
          </p>
          <Button onClick={openAdd} className="rounded-full gap-2">
            <Plus className="h-4 w-4" />
            Add Address
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-2 gap-4"
        >
          <AnimatePresence>
            {addresses.map((addr, index) => (
              <motion.div
                key={addr.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Card className={cn(
                  'overflow-hidden hover:shadow-xl transition-all duration-300 group',
                  addr.isDefault && 'ring-2 ring-primary ring-offset-2'
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex gap-3">
                        <div className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5',
                          addr.isDefault ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        )}>
                          <Building className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-medium">{addr.street}</p>
                          <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zipCode}</p>
                          <p className="text-sm text-muted-foreground">{addr.country}</p>
                          {addr.isDefault && (
                            <Badge variant="default" className="mt-1.5 text-[10px] px-2 py-0.5">Default</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(addr)} className="h-9 w-9 rounded-xl hover:bg-muted">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)} disabled={deleting === addr.id} className="h-9 w-9 rounded-xl hover:bg-destructive/10">
                          {deleting === addr.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
