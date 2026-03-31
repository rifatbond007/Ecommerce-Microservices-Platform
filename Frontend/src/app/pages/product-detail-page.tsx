import { useState } from 'react';
import { useParams, Link } from 'react-router';
import { Star, Heart, Share2, ShoppingCart, Minus, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Card, CardContent } from '../components/ui/card';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { products, reviews, categories, brands } from '../lib/mock-data';
import { useCartStore } from '../store/cart-store';
import { toast } from 'sonner';

export function ProductDetailPage() {
  const { slug } = useParams();
  const product = products.find(p => p.slug === slug);
  const { addItem } = useCartStore();
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Product not found</h1>
        <Button asChild className="mt-4">
          <Link to="/products">Back to Products</Link>
        </Button>
      </div>
    );
  }

  const category = categories.find(c => c.id === product.categoryId);
  const brand = brands.find(b => b.id === product.brandId);
  const productReviews = reviews.filter(r => r.productId === product.id);

  const handleAddToCart = () => {
    const variant = product.variants?.find(v => v.id === selectedVariant);
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.images[0],
      price: variant?.price || product.price,
      variantId: selectedVariant || undefined,
      variantDetails: variant?.name,
    });
    toast.success(`Added ${quantity}x to cart!`);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-foreground">Products</Link>
        {category && (
          <>
            <span>/</span>
            <Link to={`/category/${category.slug}`} className="hover:text-foreground">
              {category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            <img
              src={product.images[selectedImage]}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="grid grid-cols-4 gap-4">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square overflow-hidden rounded-lg border-2 ${
                    selectedImage === index ? 'border-primary' : 'border-transparent'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-2">
              {brand && (
                <Link to={`/brand/${brand.slug}`} className="text-sm text-muted-foreground hover:underline">
                  {brand.name}
                </Link>
              )}
              {product.isFeatured && <Badge>Featured</Badge>}
            </div>
            <h1 className="text-3xl font-bold">{product.name}</h1>
            
            {/* Rating */}
            <div className="mt-4 flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>
          </div>

          <Separator />

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">${product.price.toFixed(2)}</span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-muted-foreground line-through">
                  ${product.originalPrice.toFixed(2)}
                </span>
                <Badge variant="destructive">
                  Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </Badge>
              </>
            )}
          </div>

          {/* Description */}
          <p className="text-muted-foreground">{product.description}</p>

          {/* Variants */}
          {product.variants && product.variants.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold">Select Variant</h3>
              <div className="grid grid-cols-3 gap-2">
                {product.variants.map((variant) => (
                  <Button
                    key={variant.id}
                    variant={selectedVariant === variant.id ? 'default' : 'outline'}
                    onClick={() => setSelectedVariant(variant.id)}
                    disabled={variant.stock === 0}
                  >
                    {variant.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Stock Status */}
          <div>
            {product.stock > 0 ? (
              <Badge variant="outline" className="border-green-500 text-green-500">
                In Stock ({product.stock} available)
              </Badge>
            ) : (
              <Badge variant="outline" className="border-red-500 text-red-500">
                Out of Stock
              </Badge>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="font-semibold">Quantity:</span>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                disabled={quantity >= product.stock}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              size="lg"
              className="flex-1"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || (product.variants && !selectedVariant)}
            >
              <ShoppingCart className="mr-2 h-5 w-5" />
              Add to Cart
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="description" className="mt-12">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({productReviews.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="description" className="mt-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-muted-foreground">{product.description}</p>
              <div className="mt-6 space-y-2">
                <h3 className="font-semibold">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Category:</span> {category?.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Brand:</span> {brand?.name}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stock:</span> {product.stock} units
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reviews" className="mt-6">
          <div className="space-y-4">
            {productReviews.length > 0 ? (
              productReviews.map((review) => (
                <Card key={review.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback>{review.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="mb-2 flex items-center justify-between">
                          <div>
                            <p className="font-semibold">{review.userName}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating
                                      ? 'fill-yellow-400 text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No reviews yet. Be the first to review this product!
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
