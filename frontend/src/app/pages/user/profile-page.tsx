import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { userApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [form, setForm] = useState({ firstName: '', lastName: '', phone: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) setForm({ firstName: user.firstName || '', lastName: user.lastName || '', phone: '' });
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await userApi.updateProfile(form);
      setUser(data.user || data);
    } catch { /* handled */ } finally { setSaving(false); }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader><CardTitle>Personal Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>First Name</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} /></div>
              <div className="space-y-2"><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} /></div>
            </div>
            <div className="space-y-2"><Label>Email</Label><Input value={user?.email || ''} disabled /></div>
            <div className="space-y-2"><Label>Username</Label><Input value={user?.username || ''} disabled /></div>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle>Quick Links</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/orders'}>My Orders</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/addresses'}>Addresses</Button>
              <Button variant="outline" className="w-full justify-start" onClick={() => window.location.href = '/wishlists'}>Wishlists</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
