import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Truck, ShieldCheck, Sparkles, ShoppingBag } from 'lucide-react';
import { productApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: string[];
  slug: string;
}

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: Sparkles, title: 'Premium Quality', desc: 'Curated products' },
  { icon: ShoppingBag, title: 'Easy Returns', desc: '30-day return policy' },
];

export function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productApi
      .getProducts({ limit: 8 })
      .then((res) => setProducts(res.data.products || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      {/* Hero Card — mimics the reference email's centered white card */}
      <div className="border border-[#e5e5e5] bg-white">
        {/* Hero */}
        <div className="px-8 py-16 md:px-16 md:py-20 border-b border-[#e5e5e5]">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
            Premium E-Commerce
          </p>
          <h1 className="mt-6 text-4xl md:text-5xl lg:text-6xl font-bold text-[#111111] leading-[1.1]">
            Discover Products<br />
            That Inspire.
          </h1>
          <p className="mt-6 text-base md:text-lg text-[#666666] leading-relaxed max-w-xl">
            Shop the latest trends with confidence. Premium products, curated just for you.
            Free shipping on all orders over $50.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" onClick={() => navigate('/products')}>
              Shop Now <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/categories')}>
              Browse Categories <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Features */}
        <div className="px-8 md:px-16 py-10 border-b border-[#e5e5e5]">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {features.map((f) => (
              <div key={f.title}>
                <f.icon className="h-5 w-5 text-[#111111]" />
                <p className="mt-3 text-sm font-bold text-[#111111] uppercase tracking-wider">{f.title}</p>
                <p className="mt-1 text-xs text-[#666666]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        <div className="px-8 md:px-16 py-12 border-b border-[#e5e5e5]">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                Curated Selection
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#111111]">
                Featured Products
              </h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="border border-[#e5e5e5] bg-white">
                  <div className="aspect-square bg-[#f5f5f5] animate-pulse" />
                  <div className="p-4 space-y-2">
                    <div className="h-3 bg-[#f5f5f5] animate-pulse w-3/4" />
                    <div className="h-4 bg-[#f5f5f5] animate-pulse w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="group">
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-square bg-[#f5f5f5] overflow-hidden relative">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#666666] text-xs font-bold uppercase tracking-wider">
                          No Image
                        </div>
                      )}
                      {product.comparePrice && (
                        <span className="absolute top-2 left-2 bg-[#111111] text-white text-[10px] font-bold px-2 py-1">
                          -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="text-sm font-bold text-[#111111] truncate uppercase tracking-wider">
                        {product.name}
                      </h3>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-base font-bold text-[#111111]">${product.price}</span>
                      {product.comparePrice && (
                        <span className="text-xs text-[#666666] line-through">
                          ${product.comparePrice}
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full mt-3 text-xs"
                      size="sm"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      Quick View
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="px-8 md:px-16 py-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
            Get Started
          </p>
          <h2 className="mt-3 text-2xl md:text-3xl font-bold text-[#111111]">
            Ready to Start Shopping?
          </h2>
          <p className="mt-3 text-sm text-[#666666] max-w-md mx-auto">
            Join thousands of happy customers. Get access to exclusive deals and new arrivals.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button onClick={() => navigate('/register')}>
              Create Account <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/products')}>
              Browse Products <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>

        {/* Footer inside card — like reference */}
        <div className="px-8 md:px-16 py-5 bg-[#fafafa] border-t border-[#e5e5e5] text-center">
          <p className="text-xs text-[#777777] uppercase tracking-wider">
            Market — Premium Products, Curated with Care
          </p>
        </div>
      </div>
    </div>
  );
}
