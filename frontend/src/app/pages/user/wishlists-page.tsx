import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi, productApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';

interface WishlistItemData {
  id: string;
  productId: string;
  variantId: string | null;
  notes: string | null;
  priority: number;
  addedAt: string;
}

interface ProductData {
  id: string;
  name: string;
  basePrice: string;
  images: string[];
  slug: string;
}

export function WishlistsPage() {
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [items, setItems] = useState<WishlistItemData[]>([]);
  const [products, setProducts] = useState<Map<string, ProductData>>(new Map());
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await userApi.getWishlists();
      const wishlists = Array.isArray(r.data) ? r.data : [];
      if (wishlists.length > 0) {
        setWishlistId(wishlists[0].id);
        const wishlistItems = wishlists[0].items || [];
        setItems(wishlistItems);
        const ids = [...new Set<string>(wishlistItems.map((i: WishlistItemData) => i.productId))];
        const productMap = new Map<string, ProductData>();
        await Promise.all(ids.map(async (pid) => {
          try {
            const pr = await productApi.getProduct(pid);
            const p = Array.isArray(pr.data) ? pr.data[0] : pr.data;
            if (p && p.id) productMap.set(pid, p);
          } catch { /* skip */ }
        }));
        setProducts(productMap);
      }
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleRemove = async (productId: string) => {
    if (!wishlistId) return;
    try {
      await userApi.removeWishlistItem(wishlistId, productId);
      setItems(prev => prev.filter(i => i.productId !== productId));
    } catch { /* ignore */ }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="border border-[#e5e5e5] bg-white p-8 text-center">
          <p className="text-xs text-[#666666] uppercase tracking-wider">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="border border-[#e5e5e5] bg-white">
        <div className="px-8 py-12 border-b border-[#e5e5e5]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
            Saved Items
          </p>
          <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[#111111]">
            My Wishlist
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Heart className="h-12 w-12" />}
              title="Your wishlist is empty"
              description="Save your favorite items and come back to them anytime."
              action={
                <Link to="/products">
                  <Button size="sm" className="rounded-full">
                    <ShoppingBag className="h-3 w-3 mr-1" /> Browse Products
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="px-8 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map(item => {
                const product = products.get(item.productId);
                return (
                  <Card key={item.id} className="group">
                    <Link to={`/products/${item.productId}`}>
                      <div className="aspect-square bg-[#f5f5f5] overflow-hidden">
                        {product?.images?.[0] ? (
                          <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#666666] text-xs font-bold uppercase tracking-wider">
                            No Image
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-4">
                      <Link to={`/products/${item.productId}`}>
                        <h3 className="text-sm font-bold text-[#111111] truncate uppercase tracking-wider">
                          {product?.name || 'Product'}
                        </h3>
                      </Link>
                      {product?.basePrice && (
                        <p className="mt-2 text-base font-bold text-[#111111]">
                          ${parseFloat(product.basePrice).toFixed(2)}
                        </p>
                      )}
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full text-xs"
                          onClick={() => handleRemove(item.productId)}
                        >
                          <Trash2 className="h-3 w-3 mr-1" /> Remove
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        <div className="px-8 py-4 bg-[#fafafa] border-t border-[#e5e5e5] text-center">
          <p className="text-xs text-[#777777] uppercase tracking-wider">
            Market — My Wishlist
          </p>
        </div>
      </div>
    </div>
  );
}
