import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sellerApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store } from 'lucide-react';

export function BecomeSellerPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ businessName: '', description: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await sellerApi.becomeSeller(form);
      navigate('/seller');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to submit seller application');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Store className="h-6 w-6 text-primary" />
            <CardTitle>Become a Seller</CardTitle>
          </div>
          <CardDescription>Fill out the form below to start selling on our platform</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="flex h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Application'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
