import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';

export function AdminDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-6 mb-8">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" /> Users</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">-</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Products</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">-</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Orders</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">-</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Revenue</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">$0.00</p></CardContent></Card>
      </div>
    </div>
  );
}
