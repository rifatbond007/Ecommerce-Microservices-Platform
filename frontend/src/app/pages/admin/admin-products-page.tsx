import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Trash2, Power, Star } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: { id: string; name: string } | null;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
}

export function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = useCallback(async (q?: string) => {
    setLoading(true);
    setError('');
    try {
      const params = q ? { search: q } : undefined;
      const res = await adminApi.getProducts(params);
      setProducts(res.data.products || []);
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = () => {
    fetchProducts(search);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await adminApi.toggleProductActive(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
      );
    } catch {
      // silent
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await adminApi.toggleProductFeatured(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !current } : p))
      );
    } catch {
      // silent
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await adminApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-muted-foreground">Loading products...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => fetchProducts()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Product Management</h1>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Products</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-64"
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No products found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Image</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Name</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Price</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Category</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Status</th>
                    <th className="pb-3 pr-4 font-medium text-sm text-muted-foreground">Featured</th>
                    <th className="pb-3 font-medium text-sm text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b last:border-0">
                      <td className="py-3 pr-4">
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground text-xs">
                            No img
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-medium">{product.name}</td>
                      <td className="py-3 pr-4">${product.price.toFixed(2)}</td>
                      <td className="py-3 pr-4 text-muted-foreground">
                        {product.category?.name ?? '-'}
                      </td>
                      <td className="py-3 pr-4">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            product.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          )}
                        >
                          {product.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {product.isFeatured ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Star className="h-3 w-3 mr-1" /> Featured
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(product.id, product.isActive)}
                            title={product.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power
                              className={cn(
                                'h-4 w-4',
                                product.isActive ? 'text-green-600' : 'text-muted-foreground'
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                            title={product.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            <Star
                              className={cn(
                                'h-4 w-4',
                                product.isFeatured ? 'text-yellow-500' : 'text-muted-foreground'
                              )}
                            />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
