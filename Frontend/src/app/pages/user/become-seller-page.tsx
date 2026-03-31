import { Store } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { useAuthStore } from '../../store/auth-store';
import { toast } from 'sonner';

export function BecomeSellerPage() {
  const { user } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success('Seller request submitted! We will review your application.');
  };

  if (user?.role === 'seller' || user?.role === 'admin') {
    return (
      <Card>
        <CardContent className="py-16 text-center">
          <Store className="mb-4 inline-block h-16 w-16 text-green-500" />
          <h2 className="mb-2 text-xl font-bold">You're already a seller!</h2>
          <p className="mb-6 text-muted-foreground">Access your seller dashboard</p>
          <Button>Go to Seller Dashboard</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Become a Seller</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Seller Benefits</CardTitle>
          <CardDescription>Start selling on our platform and grow your business</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Reach millions of customers
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Easy product management
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              Secure payment processing
            </li>
            <li className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary" />
              24/7 seller support
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seller Application</CardTitle>
          <CardDescription>Fill out the form below to request seller access</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <Input id="businessType" placeholder="e.g., Individual, LLC, Corporation" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea id="description" rows={4} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website (Optional)</Label>
              <Input id="website" type="url" />
            </div>
            <Button type="submit">Submit Application</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
