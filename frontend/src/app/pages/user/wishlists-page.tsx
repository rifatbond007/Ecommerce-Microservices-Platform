import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { userApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Heart } from 'lucide-react';

interface WishlistItem { id: string; product: { id: string; name: string; price: number; images: string[] } }

export function WishlistsPage() {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => userApi.getWishlists().then(r => setItems(r.data.wishlists || r.data || [])).catch(console.error).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const handleRemove = async (productId: string) => { await userApi.removeFromWishlist(productId); load(); };

  if (loading) return <div className="container mx-auto px-4 py-8 text-center">Loading...</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">My Wishlists</h1>
      {items.length === 0 ? (
        <div className="text-center py-16"><Heart className="h-12 w-12 mx-auto text-muted-foreground mb-4" /><p className="text-muted-foreground">Your wishlist is empty</p></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <Link to={`/products/${item.product.id}`}>
                <div className="aspect-square bg-muted flex items-center justify-center text-muted-foreground">{item.product.images[0] ? <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" /> : 'No Image'}</div>
              </Link>
              <CardContent className="p-4">
                <Link to={`/products/${item.product.id}`}><h3 className="font-medium truncate">{item.product.name}</h3></Link>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold">${item.product.price}</span>
                  <Button variant="ghost" size="icon" onClick={() => handleRemove(item.product.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
