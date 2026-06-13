import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trash2, Heart, ShoppingBag, Star } from 'lucide-react';

interface WishlistItem { id: string; product: { id: string; name: string; price: number; images: string[] } }

function WishlistSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-9 w-48 mb-8" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-square" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-9 w-9 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function WishlistsPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => userApi.getWishlists().then(r => setItems(r.data.wishlists || r.data || [])).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleRemove = async (productId: string) => { await userApi.removeFromWishlist(productId); load(); };

  if (loading) return <WishlistSkeleton />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="container mx-auto px-4 py-8"
    >
      <div className="flex items-center gap-3 mb-8">
        <Heart className="h-7 w-7 text-primary" />
        <h1 className="text-3xl font-bold">My Wishlists</h1>
      </div>

      {items.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
            <Heart className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Save your favorite items and come back to them anytime.
          </p>
          <Link to="/products">
            <Button size="lg" className="rounded-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              Browse Products
            </Button>
          </Link>
        </motion.div>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            layout
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {items.map(item => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
              >
                <Card className="overflow-hidden group hover:shadow-xl transition-all duration-300">
                  <Link to={`/products/${item.product.id}`}>
                    <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden">
                      {item.product.images[0] ? (
                        <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <Star className="h-10 w-10 text-muted-foreground" />
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/products/${item.product.id}`}>
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">{item.product.name}</h3>
                    </Link>
                    <div className="flex items-center justify-between mt-3">
                      <span className="font-semibold text-lg">${item.product.price.toFixed(2)}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemove(item.product.id)}
                        className="h-9 w-9 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
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
