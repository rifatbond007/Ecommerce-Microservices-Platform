import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Minus, Plus, ShoppingCart, Star } from 'lucide-react';
import { productApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string; name: string; description: string; price: number; comparePrice?: number; images: string[]; category?: { name: string };
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    productApi.getProduct(id).then(r => setProduct(r.data.product || r.data)).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    setAdding(true);
    try {
      await useCartStore.getState().addItem(id!, qty);
      toast({ title: 'Added to cart', description: `${product?.name} × ${qty}` });
    } catch (e) { console.error(e); setAdding(false); }
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-4 w-24 mb-8" />
      <div className="grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square rounded-2xl" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-24 w-full" />
          <div className="flex gap-4">
            <Skeleton className="h-12 w-32 rounded-full" />
            <Skeleton className="h-12 w-20" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h2 className="text-2xl font-bold mb-4">Product not found</h2>
      <Button variant="outline" onClick={() => navigate('/products')}>Back to Products</Button>
    </div>
  );

  const discount = product.comparePrice ? Math.round((1 - product.price / product.comparePrice) * 100) : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/products" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
        <ChevronLeft className="h-4 w-4" /> Back to Products
      </Link>

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="aspect-square bg-muted rounded-2xl overflow-hidden mb-4 relative">
            {product.images[selectedImage] ? (
              <img src={product.images[selectedImage]} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">No Image</div>
            )}
            {discount > 0 && (
              <Badge variant="destructive" className="absolute top-4 left-4 text-sm px-3 py-1">-{discount}%</Badge>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-primary' : 'border-transparent'}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {product.category && (
            <Badge variant="secondary" className="mb-3">{product.category.name}</Badge>
          )}
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>

          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            ))}
            <span className="text-sm text-muted-foreground ml-2">(12 reviews)</span>
          </div>

          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-3xl font-bold text-primary">${product.price}</span>
            {product.comparePrice && (
              <span className="text-xl text-muted-foreground line-through">${product.comparePrice}</span>
            )}
          </div>

          <Separator className="mb-6" />

          <p className="text-muted-foreground leading-relaxed mb-6">{product.description}</p>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-sm font-medium">Quantity:</span>
            <div className="flex items-center border rounded-full">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="h-10 w-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center font-medium">{qty}</span>
              <button
                onClick={() => setQty(qty + 1)}
                className="h-10 w-10 flex items-center justify-center hover:bg-muted rounded-full transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button size="lg" className="rounded-full px-8 gap-2" onClick={handleAddToCart} disabled={adding}>
              <ShoppingCart className="h-5 w-5" />
              {adding ? 'Adding...' : 'Add to Cart'}
            </Button>
            <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => navigate(`/products/${id}/reviews`)}>
              Reviews
            </Button>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { label: 'Free Shipping', desc: 'On orders over $50' },
              { label: 'Easy Returns', desc: '30-day return policy' },
              { label: 'Secure Checkout', desc: 'SSL encrypted' },
            ].map(({ label, desc }) => (
              <div key={label} className="text-center p-3 rounded-xl bg-muted/50">
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
