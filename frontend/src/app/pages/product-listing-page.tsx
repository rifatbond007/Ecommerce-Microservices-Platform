import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productApi } from '@/lib/api';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Product {
  id: string; name: string; price: number; comparePrice?: number; images: string[]; slug: string;
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    productApi.getProducts({ limit: 50 }).then(r => setProducts(r.data.products || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      <Input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md mb-6" />
      {loading ? <div className="text-center py-8">Loading...</div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {filtered.map(p => (
            <Card key={p.id} className="overflow-hidden">
              <Link to={`/products/${p.id}`}>
                <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground">
                  {p.images[0] ? <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" /> : 'No Image'}
                </div>
              </Link>
              <CardContent className="p-4">
                <Link to={`/products/${p.id}`}><h3 className="font-medium truncate">{p.name}</h3></Link>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-lg font-semibold">${p.price}</span>
                  {p.comparePrice && <span className="text-sm text-muted-foreground line-through">${p.comparePrice}</span>}
                </div>
              </CardContent>
              <CardFooter className="p-4 pt-0">
                <Link to={`/products/${p.id}`} className="w-full"><Button className="w-full">View Details</Button></Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
