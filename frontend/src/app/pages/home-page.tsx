import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Truck, ShieldCheck, Sparkles, ShoppingBag,
  Star, Package, Users, Award, ChevronRight,
} from 'lucide-react';
import { productApi, brandApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
interface BrandResponse {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  basePrice: string;
  compareAtPrice: string | null;
  images: string[];
  slug: string;
  averageRating: string;
  reviewCount: number;
  totalSold: number;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string } | null;
  brand: { id: string; name: string; slug: string } | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  children: Category[];
  productCount?: number;
}

const features = [
  { icon: Truck, title: 'Free Shipping', desc: 'On orders over $50' },
  { icon: ShieldCheck, title: 'Secure Payment', desc: '100% secure checkout' },
  { icon: Sparkles, title: 'Premium Quality', desc: 'Curated products' },
  { icon: ShoppingBag, title: 'Easy Returns', desc: '30-day return policy' },
];

const stats = [
  { icon: Package, value: '10K+', label: 'Products' },
  { icon: Users, value: '50K+', label: 'Happy Customers' },
  { icon: Star, value: '4.8', label: 'Average Rating' },
  { icon: Award, value: '100%', label: 'Satisfaction' },
];

/* ── Product Card ── */

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  const images: string[] = Array.isArray(product.images) ? product.images : [];
  const priceNum = parseFloat(product.basePrice);
  const compareNum = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const discount = compareNum ? Math.round((1 - priceNum / compareNum) * 100) : 0;

  return (
    <Card className="group">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-[#f5f5f5] overflow-hidden relative">
          {images[0] ? (
            <img
              src={images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#666666] text-xs font-bold uppercase tracking-wider">
              No Image
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-[#111111] text-white text-[10px] font-bold px-2 py-1">
              -{discount}%
            </span>
          )}
          {product.totalSold > 50 && (
            <span className="absolute top-2 right-2 bg-white text-[#111111] text-[10px] font-bold px-2 py-1 border border-[#e5e5e5]">
              Bestseller
            </span>
          )}
        </div>
      </Link>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] text-[#666666] uppercase tracking-wider mb-1">
          {product.brand && <span>{product.brand.name}</span>}
          {product.brand && product.category && <span>·</span>}
          {product.category && <span>{product.category.name}</span>}
        </div>
        <Link to={`/products/${product.id}`}>
          <h3 className="text-sm font-bold text-[#111111] truncate uppercase tracking-wider">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-bold text-[#111111]">${priceNum.toFixed(2)}</span>
          {compareNum && (
            <span className="text-xs text-[#666666] line-through">${compareNum.toFixed(2)}</span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-[#111111] text-[#111111]" />
            <span className="text-xs text-[#666666]">
              {parseFloat(product.averageRating).toFixed(1)} ({product.reviewCount})
            </span>
          </div>
        )}
        <div className="mt-3 flex gap-2">
          <Button className="flex-1 text-xs" size="sm" onClick={() => navigate(`/products/${product.id}`)}>
            Quick View
          </Button>
          <Button variant="outline" size="sm" className="text-xs" onClick={() => navigate(`/products/${product.id}`)}>
            Details <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productApi.getFeatured(),
      productApi.getProducts({ limit: 4 }),
      productApi.getCategoryTree(),
      brandApi.getBrands({ limit: 8 }),
    ])
      .then(([featuredRes, newRes, catRes, brandRes]) => {
        setFeatured(featuredRes.data ?? []);
        setNewArrivals(newRes.data ?? []);
        setCategories(catRes.data ?? []);
        setBrands(brandRes.data ?? []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="border-b border-[#e5e5e5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-20 md:py-28">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
            Premium E-Commerce
          </p>
          <h1 className="mt-6 text-4xl md:text-6xl lg:text-7xl font-bold text-[#111111] leading-[1.05] tracking-tight">
            Discover Products<br />
            <span className="text-[#666666]">That Inspire.</span>
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
          <div className="mt-12 flex flex-wrap gap-x-10 gap-y-4">
            {stats.map((s) => (
              <div key={s.label}>
                <p className="text-2xl md:text-3xl font-bold text-[#111111]">{s.value}</p>
                <p className="text-xs text-[#666666] uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {features.map((f) => (
            <div key={f.title}>
              <f.icon className="h-5 w-5 text-[#111111]" />
              <p className="mt-3 text-sm font-bold text-[#111111] uppercase tracking-wider">{f.title}</p>
              <p className="mt-1 text-xs text-[#666666]">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categories ── */}
      <section className="border-y border-[#e5e5e5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                Browse By Category
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#111111]">Categories</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/categories')}>
              View All <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border border-[#e5e5e5] bg-white p-8 aspect-[3/2]">
                  <div className="h-4 bg-[#f5f5f5] animate-pulse w-2/3 mx-auto mt-6" />
                  <div className="h-3 bg-[#f5f5f5] animate-pulse w-1/3 mx-auto mt-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/products?categoryId=${cat.id}`}
                  className="border border-[#e5e5e5] bg-white p-8 text-center hover:bg-[#fafafa] transition-colors group"
                >
                  <p className="text-sm font-bold text-[#111111] uppercase tracking-wider group-hover:opacity-70 transition-opacity">
                    {cat.name}
                  </p>
                  {cat.productCount !== undefined && (
                    <p className="mt-2 text-xs text-[#666666]">{cat.productCount} items</p>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
              Curated Selection
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#111111]">Featured Products</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
            {featured.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── Brands ── */}
      {!loading && brands.length > 0 && (
        <section className="border-y border-[#e5e5e5] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <div className="text-center mb-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                Trusted Brands
              </p>
              <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#111111]">Shop by Brand</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brandId=${brand.id}`}
                  className="border border-[#e5e5e5] bg-white p-6 text-center hover:bg-[#fafafa] transition-colors group"
                >
                  <p className="text-sm font-bold text-[#111111] uppercase tracking-wider group-hover:opacity-70 transition-opacity">
                    {brand.name}
                  </p>
                  {brand.description && (
                    <p className="mt-1 text-xs text-[#666666] line-clamp-2">{brand.description}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New Arrivals ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
              Fresh From The Collection
            </p>
            <h2 className="mt-2 text-2xl md:text-3xl font-bold text-[#111111]">New Arrivals</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/products')}>
            View All <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
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
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-[#e5e5e5] bg-white">
        <div className="mx-auto max-w-5xl px-6 py-16 text-center">
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
      </section>
    </div>
  );
}
