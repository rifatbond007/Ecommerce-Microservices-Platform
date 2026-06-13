import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ShoppingBag, Trash2, Clock } from 'lucide-react';

interface SavedCart {
  id: string;
  name: string;
  itemCount: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

export function SavedCartsPage() {
  const navigate = useNavigate();
  const [carts, setCarts] = useState<SavedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

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
    try {
      await api.post(`/saved-carts/${cartId}/restore`);
      navigate('/cart');
    } catch {
      // silently fail
    }
  }, [navigate]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Delete this saved cart?')) return;
    setDeleting(id);
    try {
      await api.delete(`/saved-carts/${id}`);
      setCarts(prev => prev.filter(c => c.id !== id));
    } catch {
      setError('Failed to delete cart');
    } finally {
      setDeleting(null);
    }
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Saved Carts</h1>

      {error && (
        <div className="flex items-center gap-2 text-destructive mb-4 p-3 rounded-md bg-destructive/10">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {carts.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground mb-4">No saved carts</p>
          <Button onClick={() => navigate('/products')}>Start Shopping</Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carts.map(cart => (
            <Card key={cart.id}>
              <CardHeader>
                <CardTitle className="text-lg">{cart.name || 'Unnamed Cart'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{cart.itemCount} item{cart.itemCount !== 1 ? 's' : ''}</span>
                  <span className="font-semibold">${cart.total.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Saved {new Date(cart.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1" onClick={() => handleLoad(cart.id)}>
                    Load Cart
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(cart.id)}
                    disabled={deleting === cart.id}
                  >
                    {deleting === cart.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 text-destructive" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
