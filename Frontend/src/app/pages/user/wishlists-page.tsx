import { Heart, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { wishlists, products } from '../../lib/mock-data';
import { useAuthStore } from '../../store/auth-store';
import { ProductCard } from '../../components/product-card';

export function WishlistsPage() {
  const { user } = useAuthStore();
  const userWishlists = wishlists.filter(w => w.userId === user?.id);
  const defaultWishlist = userWishlists.find(w => w.isDefault);
  const wishlistProducts = defaultWishlist
    ? products.filter(p => defaultWishlist.productIds.includes(p.id))
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Wishlists</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Wishlist
        </Button>
      </div>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Heart className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-bold">Your wishlist is empty</h2>
            <p className="mb-6 text-muted-foreground">Save products you love to your wishlist</p>
            <Button>Browse Products</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
