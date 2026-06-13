import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Trash2, Power, Star, Package } from 'lucide-react';

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const rowVariants = {
  hidden: { x: -10, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

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
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-56 mb-6" />
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={() => fetchProducts()} className="rounded-full">Retry</Button>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={rowVariants} className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Product Management</h1>
        <p className="text-muted-foreground mt-1">{products.length} product{products.length !== 1 ? 's' : ''} on the platform</p>
      </motion.div>

      <motion.div variants={rowVariants}>
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-muted-foreground" />
                All Products
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                <Input
                  placeholder="Search products..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full sm:w-64"
                />
                <Button variant="outline" size="icon" onClick={handleSearch} className="rounded-full">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {products.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No products found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left bg-muted/30">
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Image</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Name</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Price</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Category</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Status</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Featured</th>
                      <th className="sticky top-0 px-6 py-3 font-medium text-xs text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <motion.tr
                        key={product.id}
                        variants={rowVariants}
                        className="border-b last:border-0 transition-colors hover:bg-muted/20"
                      >
                        <td className="px-6 py-4">
                          {product.images && product.images[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.name}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
                              <Package className="h-5 w-5" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 font-medium text-sm">{product.name}</td>
                        <td className="px-6 py-4 font-medium">${product.price.toFixed(2)}</td>
                        <td className="px-6 py-4 text-muted-foreground text-sm">
                          {product.category?.name ? (
                            <Badge variant="secondary">{product.category.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {product.isActive ? (
                            <Badge variant="success">Active</Badge>
                          ) : (
                            <Badge variant="destructive">Inactive</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {product.isFeatured ? (
                            <Badge variant="warning">
                              <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleActive(product.id, product.isActive)}
                              title={product.isActive ? 'Deactivate' : 'Activate'}
                              className="rounded-full"
                            >
                              <Power className={product.isActive ? 'h-4 w-4 text-green-600' : 'h-4 w-4 text-muted-foreground'} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                              title={product.isFeatured ? 'Unfeature' : 'Feature'}
                              className="rounded-full"
                            >
                              <Star className={product.isFeatured ? 'h-4 w-4 text-amber-500' : 'h-4 w-4 text-muted-foreground'} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(product.id)}
                              title="Delete"
                              className="rounded-full text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
