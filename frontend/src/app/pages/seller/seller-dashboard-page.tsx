import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, Plus, BarChart3 } from 'lucide-react';

export function SellerDashboardPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Products</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">-</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Orders</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">-</p></CardContent></Card>
      </div>
      <div className="flex gap-4">
        <Link to="/seller/products"><Button><Package className="mr-2 h-4 w-4" /> Manage Products</Button></Link>
      </div>
    </div>
  );
}
