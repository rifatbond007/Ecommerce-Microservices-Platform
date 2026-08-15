import { useState, useEffect, useCallback } from 'react';
import { adminApi, getErrorMessage } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/pagination';
import { Search, Trash2, Power, Star, Package, RefreshCw } from 'lucide-react';

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
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingDelete, setPendingDelete] = useState<Product | null>(null);
  const limit = 20;

  const fetchProducts = useCallback(
    async (q?: string, p = 1) => {
      setLoading(true);
      setError('');
      try {
        const res = await adminApi.getProducts({ search: q, page: p, limit });
        const data = (res.data ?? {}) as { products?: Product[]; total?: number };
        setProducts(data.products ?? []);
        setTotal(data.total ?? (data.products?.length ?? 0));
      } catch (err) {
        setError(getErrorMessage(err, 'Failed to load products'));
      } finally {
        setLoading(false);
      }
    },
    [limit]
  );

  useEffect(() => {
    fetchProducts(undefined, page);
  }, [fetchProducts, page]);

  const handleSearch = () => {
    setPage(1);
    fetchProducts(search, 1);
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      await adminApi.toggleProductActive(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: !current } : p))
      );
      toast({ title: `Product ${!current ? 'activated' : 'deactivated'}`, variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Toggle failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    try {
      await adminApi.toggleProductFeatured(id);
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isFeatured: !current } : p))
      );
      toast({ title: `Product ${!current ? 'featured' : 'unfeatured'}`, variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Toggle failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    try {
      await adminApi.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Product deleted', variant: 'success' as const });
    } catch (err) {
      toast({
        title: 'Delete failed',
        description: getErrorMessage(err),
        variant: 'destructive',
      });
    }
  };

  if (loading && products.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Product Management</h1>
        <p className="text-muted-foreground mt-2">
          {total} product{total !== 1 ? 's' : ''} on the platform
        </p>
      </div>

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
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => fetchProducts(search, page)}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-destructive">{error}</div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No products found.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.images && product.images[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-muted-foreground">
                            <Package className="h-5 w-5" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="font-medium">${product.price.toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category?.name ? (
                          <Badge variant="secondary">{product.category.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground/60">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isActive ? (
                          <Badge variant="success">Active</Badge>
                        ) : (
                          <Badge variant="destructive">Inactive</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.isFeatured ? (
                          <Badge variant="warning">
                            <Star className="h-3 w-3 mr-1 fill-current" /> Featured
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground/60 text-xs">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(product.id, product.isActive)}
                            title={product.isActive ? 'Deactivate' : 'Activate'}
                          >
                            <Power className={product.isActive ? 'h-4 w-4 text-success' : 'h-4 w-4 text-muted-foreground'} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleFeatured(product.id, product.isFeatured)}
                            title={product.isFeatured ? 'Unfeature' : 'Feature'}
                          >
                            <Star className={product.isFeatured ? 'h-4 w-4 text-warning' : 'h-4 w-4 text-muted-foreground'} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setPendingDelete(product)}
                            title="Delete"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                page={page}
                totalPages={Math.max(1, Math.ceil(total / limit))}
                onPageChange={setPage}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!pendingDelete} onOpenChange={(o) => !o && setPendingDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete product?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{pendingDelete?.name}</strong>.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}