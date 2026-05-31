import { useState, useEffect } from 'react';
import { sellerApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface Product { id: string; name: string; price: number; stock: number; images: string[] }

export function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sellerApi.getProducts().then(r => setProducts(r.data.products || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Button>Add Product</Button>
      </div>
      <div className="space-y-4">
        {products.map(p => (
          <Card key={p.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="w-16 h-16 bg-muted rounded flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground">{p.images[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover rounded" /> : 'img'}</div>
              <div className="flex-1"><p className="font-medium">{p.name}</p><p className="text-sm text-muted-foreground">${p.price} · Stock: {p.stock}</p></div>
              <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </CardContent>
          </Card>
        ))}
        {products.length === 0 && <p className="text-center text-muted-foreground py-8">No products yet</p>}
      </div>
    </div>
  );
}
