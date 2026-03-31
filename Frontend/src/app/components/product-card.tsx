import { Link } from 'react-router';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardFooter } from './ui/card';
import { Product } from '../lib/mock-data';
import { useCartStore } from '../store/cart-store';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      price: product.price,
    });
    toast.success('Added to cart!');
  };

  const discountPercentage = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <Link to={`/products/${product.slug}`}>
      <Card className="group h-full overflow-hidden transition-shadow hover:shadow-lg">
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.images[0]}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
          {discountPercentage > 0 && (
            <Badge className="absolute left-2 top-2 bg-red-500">
              -{discountPercentage}%
            </Badge>
          )}
          {product.stock === 0 && (
            <Badge className="absolute right-2 top-2 bg-gray-500">
              Out of Stock
            </Badge>
          )}
          <Button
            size="icon"
            variant="secondary"
            className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => {
              e.preventDefault();
              toast.success('Added to wishlist!');
            }}
          >
            <Heart className="h-4 w-4" />
          </Button>
        </div>
        <CardContent className="p-4">
          <div className="mb-2 flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm">{product.rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>
          <h3 className="mb-2 line-clamp-2 font-semibold">{product.name}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <span className="text-sm text-muted-foreground line-through">
                ${product.originalPrice.toFixed(2)}
              </span>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button
            className="w-full"
            onClick={handleAddToCart}
            disabled={product.stock === 0}
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
}
