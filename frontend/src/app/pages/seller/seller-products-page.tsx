import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sellerApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Trash2, Plus, Package, AlertCircle } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock: number;
  images: string[];
  categoryId?: string;
  sku?: string;
}

interface ProductForm {
  name: string;
  description: string;
  price: string;
  stock: string;
  imageUrl: string;
  categoryId: string;
  sku: string;
}

const emptyForm: ProductForm = { name: '', description: '', price: '', stock: '', imageUrl: '', categoryId: '', sku: '' };

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 },
  },
};

function stockBadge(stock: number) {
  if (stock <= 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (stock <= 5) return <Badge variant="warning">{stock} left</Badge>;
  return <Badge variant="success">{stock} in stock</Badge>;
}

export function SellerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await sellerApi.getProducts();
      setProducts(data.products || []);
      setError('');
    } catch {
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      price: String(product.price),
      stock: String(product.stock),
      imageUrl: product.images?.[0] || '',
      categoryId: product.categoryId || '',
      sku: product.sku || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        stock: parseInt(form.stock, 10),
        imageUrl: form.imageUrl,
        categoryId: form.categoryId || undefined,
        sku: form.sku || undefined,
      };
      if (editingId) {
        await sellerApi.updateProduct(editingId, payload);
      } else {
        await sellerApi.createProduct(payload);
      }
      setDialogOpen(false);
      await fetchProducts();
    } catch {
      setError('Failed to save product');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await sellerApi.deleteProduct(id);
      await fetchProducts();
    } catch {
      setError('Failed to delete product');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="flex items-center gap-4 p-4">
                <Skeleton className="w-16 h-16 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
          <p className="text-muted-foreground mt-1">{products.length} product{products.length !== 1 ? 's' : ''} listed</p>
        </div>
        <Button onClick={openCreate} className="rounded-full shadow-sm">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </motion.div>

      {error && (
        <motion.div variants={itemVariants} className="flex items-center gap-2 text-sm text-destructive mb-4 bg-destructive/10 px-4 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}

      {products.length === 0 ? (
        <motion.div variants={itemVariants} className="text-center py-16">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-1">No products yet</h3>
          <p className="text-muted-foreground mb-6">Get started by adding your first product.</p>
          <Button onClick={openCreate} className="rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="space-y-3">
          {products.map((p) => (
            <motion.div key={p.id} layout variants={itemVariants}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="w-16 h-16 bg-muted rounded-lg flex-shrink-0 flex items-center justify-center text-xs text-muted-foreground overflow-hidden">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="h-6 w-6" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      ${p.price.toFixed(2)}
                    </p>
                    <div className="mt-1">{stockBadge(p.stock)}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)} className="rounded-full">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="rounded-full text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingId ? 'Edit Product' : 'Add Product'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="Product name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Brief description of your product"
                className="flex h-20 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price ($)</Label>
                <Input id="price" type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required placeholder="0.00" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required placeholder="0" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input id="imageUrl" value={form.imageUrl} onChange={e => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://example.com/image.jpg" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoryId">Category ID</Label>
                <Input id="categoryId" value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })} placeholder="Optional" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="Optional" />
              </div>
            </div>
            <Button type="submit" className="w-full rounded-full" disabled={submitting}>
              {submitting ? 'Saving...' : editingId ? 'Update Product' : 'Create Product'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
