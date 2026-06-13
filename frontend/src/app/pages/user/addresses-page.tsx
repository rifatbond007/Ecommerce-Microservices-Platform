import { useState, useEffect, useCallback } from 'react';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Loader2, AlertCircle, MapPin } from 'lucide-react';
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Address' : 'Add Address'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Street</Label>
                <Input value={form.street} onChange={e => setForm({ ...form, street: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>ZIP Code</Label>
                  <Input value={form.zipCode} onChange={e => setForm({ ...form, zipCode: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={form.country} onChange={e => setForm({ ...form, country: e.target.value })} />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={e => setForm({ ...form, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <label htmlFor="isDefault" className="text-sm font-medium leading-none">Set as default address</label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {editingId ? 'Update' : 'Save'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {addresses.length === 0 ? (
        <div className="text-center py-16">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No addresses saved</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <Card key={addr.id} className={cn(addr.isDefault && 'border-primary')}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">{addr.street}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zipCode}</p>
                    <p className="text-sm text-muted-foreground">{addr.country}</p>
                    {addr.isDefault && (
                      <span className="inline-block text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full mt-1">
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(addr)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)} disabled={deleting === addr.id}>
                      {deleting === addr.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-destructive" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
