import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal } from 'lucide-react';
import { productApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string; name: string; basePrice: string; compareAtPrice?: string | null; images: string[]; slug: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemAnim = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('categoryId') || undefined;

  useEffect(() => {
    setLoading(true);
    productApi
      .getProducts({ limit: 50, categoryId })
      .then(r => setProducts(r.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [categoryId]);

  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-1">{loading ? 'Loading...' : `${filtered.length} products found`}</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-full w-full sm:w-64"
            />
          </div>
          <Button variant="outline" size="icon" className="rounded-full shrink-0">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-square rounded-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-5 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Search className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No products found</h3>
          <p className="text-muted-foreground mb-6">Try adjusting your search terms</p>
          <Button variant="outline" onClick={() => setSearch('')}>Clear Search</Button>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {filtered.map(p => (
            <motion.div key={p.id} variants={itemAnim}>
              <Card className="group overflow-hidden border-0 bg-background shadow-sm hover:shadow-xl transition-all duration-300">
                <Link to={`/products/${p.id}`}>
                  <div className="aspect-square bg-muted overflow-hidden relative">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
                    )}
                    {p.compareAtPrice && Number(p.compareAtPrice) > 0 && (
                      <Badge variant="destructive" className="absolute top-2 left-2">
                        -{Math.round((1 - Number(p.basePrice) / Number(p.compareAtPrice)) * 100)}%
                      </Badge>
                    )}
                  </div>
                </Link>
                <CardContent className="p-4">
                  <Link to={`/products/${p.id}`}>
                    <h3 className="font-medium truncate group-hover:text-primary transition-colors">{p.name}</h3>
                  </Link>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">${Number(p.basePrice).toFixed(2)}</span>
                    {p.compareAtPrice && <span className="text-sm text-muted-foreground line-through">${Number(p.compareAtPrice).toFixed(2)}</span>}
                  </div>
                  <Link to={`/products/${p.id}`}>
                    <Button className="w-full mt-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0" size="sm">
                      View Details
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
