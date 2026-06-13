import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ShoppingBag, Trash2, Clock, ShoppingCart, PackageOpen, RotateCcw } from 'lucide-react';

interface SavedCart {
  id: string;
  name: string;
  itemCount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

function SavedCartsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-48 mb-8" />
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-32" /></CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-40" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-9 flex-1 rounded-full" />
                <Skeleton className="h-9 w-9 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function SavedCartsPage() {
  const navigate = useNavigate();
  const [carts, setCarts] = useState<SavedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/saved-carts');
      setCarts(r.data.carts || []);
    } catch {
      setError('Failed to load saved carts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleLoad = useCallback(async (cartId: string) => {
    setRestoring(cartId);
    try {
      await api.post(`/saved-carts/${cartId}/restore`);
      navigate('/cart');
    } catch {
      setError('Failed to restore cart');
      setRestoring(null);
    }
  }, [navigate]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Delete this saved cart?')) return;
    setDeleting(id);
    setError('');
    try {
      await api.delete(`/saved-carts/${id}`);
      setCarts(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Failed to delete cart');
    } finally {
      setDeleting(null);
    }
  }, []);

  if (loading) return <SavedCartsSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <PackageOpen className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">Saved Carts</h1>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-destructive mb-4 p-4 rounded-xl bg-destructive/10 border border-destructive/20"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </motion.div>
      )}

      {carts.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <ShoppingBag className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No saved carts</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Save your cart to come back and checkout later.
          </p>
          <Button onClick={() => navigate('/products')} size="lg" className="rounded-full gap-2">
            <ShoppingCart className="h-4 w-4" />
            Start Shopping
          </Button>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {carts.map((cart, index) => (
              <motion.div
                key={cart.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
              >
                <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                  <CardHeader className="border-b bg-muted/30 pb-3">
                    <CardTitle className="text-lg flex items-center justify-between gap-2">
                      <span className="truncate">{cart.name || 'Unnamed Cart'}</span>
                      <Badge variant="secondary" className="shrink-0">
                        {cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3 flex flex-col flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total</span>
                      <span className="font-semibold text-lg">${cart.total.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>Saved {new Date(cart.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex gap-2 pt-2 mt-auto">
                      <Button
                        size="sm"
                        className="flex-1 gap-2 rounded-full"
                        onClick={() => handleLoad(cart.id)}
                        disabled={restoring === cart.id}
                      >
                        {restoring === cart.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        ) : (
                          <RotateCcw className="h-3.5 w-3.5" />
                        )}
                        {restoring === cart.id ? 'Restoring...' : 'Restore Cart'}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(cart.id)}
                        disabled={deleting === cart.id}
                        className="rounded-full h-9 w-9 p-0"
                      >
                        {deleting === cart.id ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}
