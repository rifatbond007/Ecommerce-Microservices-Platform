import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ShoppingCart, DollarSign, Plus } from 'lucide-react';

export function SellerDashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const productsRes = await sellerApi.getProducts();
        if (cancelled) return;
        const products = productsRes.data.products?.length || 0;
        setStats({ products, orders: 0, revenue: 0 });
      } catch {
        if (!cancelled) setError('Failed to load dashboard stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Seller Dashboard</h1>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> Total Products</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.products}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5" /> Total Orders</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{stats.orders}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" /> Revenue</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">${stats.revenue.toFixed(2)}</p></CardContent>
        </Card>
      </div>
      <div className="flex gap-4">
        <Link to="/seller/products"><Button><Package className="mr-2 h-4 w-4" /> Manage Products</Button></Link>
        <Link to="/seller/products"><Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Product</Button></Link>
      </div>
    </div>
  );
}
