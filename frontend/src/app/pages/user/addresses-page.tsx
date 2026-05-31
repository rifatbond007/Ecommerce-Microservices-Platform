import { useState, useEffect } from 'react';
import { userApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface Address { id: string; street: string; city: string; state: string; zipCode: string; country: string; isDefault: boolean }

export function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => userApi.getAddresses().then(r => setAddresses(r.data.addresses || [])).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleDelete = async (id: string) => { await userApi.deleteAddress(id); load(); };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Addresses</h1>
      </div>
      {addresses.length === 0 ? <p className="text-muted-foreground text-center py-16">No addresses saved</p> : (
        <div className="grid md:grid-cols-2 gap-4">
          {addresses.map(addr => (
            <Card key={addr.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{addr.street}</p>
                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.state} {addr.zipCode}</p>
                    <p className="text-sm text-muted-foreground">{addr.country}</p>
                    {addr.isDefault && <span className="text-xs text-primary font-medium">Default</span>}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(addr.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
