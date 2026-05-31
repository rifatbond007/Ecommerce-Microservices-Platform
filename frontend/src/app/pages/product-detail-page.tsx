import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productApi, cartApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Product {
  id: string; name: string; description: string; price: number; comparePrice?: number; images: string[]; category?: { name: string };
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!id) return;
    productApi.getProduct(id).then(r => setProduct(r.data.product || r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAdding(true);
    try {
      await cartApi.addItem({ productId: id!, quantity: qty });
      navigate('/cart');
    } catch (e) { console.error(e); setAdding(false); }
  };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;
  if (!product) return <div className="container mx-auto px-4 py-8 text-center">Product not found</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="aspect-square bg-muted rounded-lg flex items-center justify-center text-muted-foreground">
          {product.images[0] ? <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover rounded-lg" /> : 'No Image'}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          {product.category && <p className="text-sm text-muted-foreground mb-4">{product.category.name}</p>}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl font-bold">${product.price}</span>
            {product.comparePrice && <span className="text-lg text-muted-foreground line-through">${product.comparePrice}</span>}
          </div>
          <p className="text-muted-foreground mb-6">{product.description}</p>
          <div className="flex items-center gap-4 mb-6">
            <label className="text-sm font-medium">Quantity:</label>
            <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} className="w-20 rounded-md border px-3 py-2 text-sm" />
          </div>
          <Button size="lg" onClick={handleAddToCart} disabled={adding}>{adding ? 'Adding...' : 'Add to Cart'}</Button>
        </div>
      </div>
    </div>
  );
}
