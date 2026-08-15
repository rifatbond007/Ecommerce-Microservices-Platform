import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight, Truck, ShieldCheck, Sparkles, ShoppingBag,
  Star, Package, Users, Award, ChevronRight, Quote,
} from 'lucide-react';
import { productApi, brandApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

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

const demoProducts: Product[] = [
  { id: 'demo-1', name: 'Classic Leather Backpack', basePrice: '89.00', compareAtPrice: '129.00', images: ['/demo/backpack.svg'], slug: 'classic-leather-backpack', averageRating: '4.8', reviewCount: 124, totalSold: 320, isFeatured: true, category: { id: 'c1', name: 'Bags', slug: 'bags' }, brand: { id: 'b1', name: 'Heritage Co.', slug: 'heritage-co' } },
  { id: 'demo-2', name: 'Minimalist Watch', basePrice: '245.00', compareAtPrice: null, images: ['/demo/watch.svg'], slug: 'minimalist-watch', averageRating: '4.6', reviewCount: 89, totalSold: 180, isFeatured: true, category: { id: 'c2', name: 'Accessories', slug: 'accessories' }, brand: { id: 'b2', name: 'Nordic', slug: 'nordic' } },
  { id: 'demo-3', name: 'Wool Blend Sweater', basePrice: '120.00', compareAtPrice: '160.00', images: ['/demo/sweater.svg'], slug: 'wool-blend-sweater', averageRating: '4.7', reviewCount: 56, totalSold: 95, isFeatured: true, category: { id: 'c3', name: 'Clothing', slug: 'clothing' }, brand: { id: 'b1', name: 'Heritage Co.', slug: 'heritage-co' } },
  { id: 'demo-4', name: 'Ceramic Pour-Over Set', basePrice: '55.00', compareAtPrice: null, images: ['/demo/pourover.svg'], slug: 'ceramic-pour-over-set', averageRating: '4.9', reviewCount: 203, totalSold: 510, isFeatured: true, category: { id: 'c4', name: 'Home', slug: 'home' }, brand: { id: 'b3', name: 'Artisan', slug: 'artisan' } },
  { id: 'demo-5', name: 'Canvas Sneakers', basePrice: '75.00', compareAtPrice: '95.00', images: ['/demo/sneakers.svg'], slug: 'canvas-sneakers', averageRating: '4.5', reviewCount: 178, totalSold: 420, isFeatured: false, category: { id: 'c3', name: 'Clothing', slug: 'clothing' }, brand: { id: 'b2', name: 'Nordic', slug: 'nordic' } },
  { id: 'demo-6', name: 'Brass Desk Lamp', basePrice: '95.00', compareAtPrice: null, images: ['/demo/lamp.svg'], slug: 'brass-desk-lamp', averageRating: '4.4', reviewCount: 42, totalSold: 130, isFeatured: false, category: { id: 'c4', name: 'Home', slug: 'home' }, brand: { id: 'b3', name: 'Artisan', slug: 'artisan' } },
  { id: 'demo-7', name: 'Leather Journal', basePrice: '34.00', compareAtPrice: null, images: ['/demo/journal.svg'], slug: 'leather-journal', averageRating: '4.3', reviewCount: 67, totalSold: 280, isFeatured: false, category: { id: 'c5', name: 'Stationery', slug: 'stationery' }, brand: { id: 'b1', name: 'Heritage Co.', slug: 'heritage-co' } },
  { id: 'demo-8', name: 'Wireless Headphones', basePrice: '199.00', compareAtPrice: '249.00', images: ['/demo/headphones.svg'], slug: 'wireless-headphones', averageRating: '4.7', reviewCount: 312, totalSold: 890, isFeatured: false, category: { id: 'c6', name: 'Electronics', slug: 'electronics' }, brand: { id: 'b4', name: 'Pulse', slug: 'pulse' } },
];

const demoCategories: Category[] = [
  { id: 'dc1', name: 'Bags', slug: 'bags', description: null, children: [], productCount: 24 },
  { id: 'dc2', name: 'Accessories', slug: 'accessories', description: null, children: [], productCount: 56 },
  { id: 'dc3', name: 'Clothing', slug: 'clothing', description: null, children: [], productCount: 89 },
  { id: 'dc4', name: 'Home', slug: 'home', description: null, children: [], productCount: 42 },
];

const demoBrands: BrandResponse[] = [
  { id: 'db1', name: 'Heritage Co.', slug: 'heritage-co', description: 'Timeless craftsmanship since 1985', logoUrl: null, isActive: true },
  { id: 'db2', name: 'Nordic', slug: 'nordic', description: 'Scandinavian minimalism', logoUrl: null, isActive: true },
  { id: 'db3', name: 'Artisan', slug: 'artisan', description: 'Handmade with care', logoUrl: null, isActive: true },
  { id: 'db4', name: 'Pulse', slug: 'pulse', description: 'Modern tech for everyday life', logoUrl: null, isActive: true },
];

const stats = [
  { icon: Package, value: '10K+', label: 'Products' },
  { icon: Users, value: '50K+', label: 'Happy Customers' },
  { icon: Star, value: '4.8', label: 'Average Rating' },
  { icon: Award, value: '100%', label: 'Satisfaction' },
];

const instaImages = [
  '/demo/insta-1.svg', '/demo/insta-2.svg', '/demo/insta-3.svg', '/demo/insta-4.svg',
  '/demo/insta-5.svg', '/demo/insta-6.svg', '/demo/insta-7.svg', '/demo/insta-8.svg',
];

function ProductCard({ product }: { product: Product }) {
  const navigate = useNavigate();

  const images: string[] = Array.isArray(product.images) ? product.images : [];
  const priceNum = parseFloat(product.basePrice);
  const compareNum = product.compareAtPrice ? parseFloat(product.compareAtPrice) : null;
  const discount = compareNum ? Math.round((1 - priceNum / compareNum) * 100) : 0;

  return (
    <Card className="group overflow-hidden">
      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-muted overflow-hidden relative">
          {images[0] ? (
            <img
              src={images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs font-bold uppercase tracking-wider">
              No Image
            </div>
          )}
          {discount > 0 && (
            <Badge className="absolute top-3 left-3">-{discount}%</Badge>
          )}
          {product.totalSold > 50 && (
            <Badge variant="outline" className="absolute top-3 right-3 bg-background">
              Bestseller
            </Badge>
          )}
        </div>
      </Link>
      <CardContent className="p-4 pb-5">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          {product.brand && <span>{product.brand.name}</span>}
          {product.brand && product.category && <span>·</span>}
          {product.category && <span>{product.category.name}</span>}
        </div>
        <Link to={`/products/${product.id}`}>
          <h3 className="text-sm font-bold text-foreground truncate uppercase tracking-wider">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-base font-bold text-foreground">${priceNum.toFixed(2)}</span>
          {compareNum && (
            <span className="text-xs text-muted-foreground line-through">${compareNum.toFixed(2)}</span>
          )}
        </div>
        {product.reviewCount > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-foreground text-foreground" />
            <span className="text-xs text-muted-foreground">
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
      productApi.getFeatured().catch(() => ({ data: [] as Product[] })),
      productApi.getProducts({ limit: 4 }).catch(() => ({ data: [] as Product[] })),
      productApi.getCategoryTree().catch(() => ({ data: [] as Category[] })),
      brandApi.getBrands({ limit: 8 }).catch(() => ({ data: [] as BrandResponse[] })),
    ])
      .then(([featuredRes, newRes, catRes, brandRes]) => {
        const featuredData = (featuredRes.data as unknown) as Product[] | undefined;
        const newData = (newRes.data as unknown) as Product[] | undefined;
        const catData = (catRes.data as unknown) as Category[] | undefined;
        const brandData = (brandRes.data as unknown) as BrandResponse[] | undefined;
        setFeatured(featuredData?.length ? featuredData : demoProducts.filter(p => p.isFeatured));
        setNewArrivals(newData?.length ? newData : demoProducts.filter(p => !p.isFeatured));
        setCategories(catData?.length ? catData : demoCategories);
        setBrands(brandData?.length ? brandData : demoBrands);
      })
      .catch(() => {
        setFeatured(demoProducts.filter(p => p.isFeatured));
        setNewArrivals(demoProducts.filter(p => !p.isFeatured));
        setCategories(demoCategories);
        setBrands(demoBrands);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-background">
      {/* ── HERO ── */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-3"
            >
              <Badge variant="outline" className="mb-6">
                Premium E-Commerce
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-foreground leading-[1.02] tracking-tighter">
                Discover products<br />
                <span className="text-muted-foreground">that inspire.</span>
              </h1>
              <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Shop the latest trends with confidence. Premium products, curated
                just for you. Free shipping on all orders over $50.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Button size="lg" onClick={() => navigate('/products')}>
                  Shop Now <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/categories')}>
                  Browse Categories
                </Button>
                <Button variant="ghost" size="lg" onClick={() => navigate('/register')}>
                  Create account
                </Button>
                <Button variant="link" size="lg" onClick={() => navigate('/about')}>
                  About us →
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-2 hidden lg:block"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div className="aspect-[3/4] bg-muted overflow-hidden">
                    <img src="/demo/hero-1.svg" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img src="/demo/hero-2.svg" alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
                <div className="space-y-3 mt-8">
                  <div className="aspect-square bg-muted overflow-hidden">
                    <img src="/demo/hero-3.svg" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="aspect-[3/4] bg-muted overflow-hidden">
                    <img src="/demo/hero-4.svg" alt="" className="w-full h-full object-cover" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── MARQUEE BRAND STRIP ── */}
      <section className="border-y border-border bg-muted/30 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap py-8">
          {[...Array(2)].map((_, k) => (
            <div key={k} className="flex items-center gap-12 px-6 shrink-0">
              {demoBrands.concat(demoBrands).map((b, i) => (
                <span
                  key={`${k}-${i}`}
                  className="text-2xl md:text-3xl font-bold tracking-widest uppercase text-muted-foreground"
                >
                  {b.name}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {features.map((f) => (
              <div key={f.title}>
                <f.icon className="h-6 w-6 text-foreground" />
                <p className="mt-3 text-sm font-bold text-foreground uppercase tracking-wider">{f.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES (4 large tiles) ── */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Browse By Category
              </p>
              <h2 className="mt-2 text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Find your thing
              </h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/categories')}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(loading ? Array.from({ length: 4 }) : categories.slice(0, 4)).map((cat, i) => {
              const c = cat as Category;
              return (
                <Link
                  key={c?.id ?? i}
                  to={`/products?categoryId=${c?.id ?? ''}`}
                  className="group relative overflow-hidden bg-muted aspect-[3/4] flex items-end p-6"
                >
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/80 transition-colors duration-500" />
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs font-bold uppercase tracking-wider">
                    {loading ? 'Loading…' : (
                      <span className="text-9xl font-black text-muted-foreground/30">
                        {c.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="relative z-10 w-full">
                    <p className="text-sm font-bold text-foreground group-hover:text-background uppercase tracking-wider transition-colors duration-500">
                      {c?.name ?? ''}
                    </p>
                    {c?.productCount !== undefined && (
                      <p className="mt-1 text-xs text-muted-foreground group-hover:text-background/70 transition-colors duration-500">
                        {c.productCount} items
                      </p>
                    )}
                    <ArrowRight className="mt-3 h-4 w-4 text-foreground group-hover:text-background transition-all duration-500 group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FEATURED PRODUCTS — carousel ── */}
      <section className="border-y border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Curated Selection
              </p>
              <h2 className="mt-2 text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Featured
              </h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/products')}>
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-4 snap-x snap-mandatory pb-4">
              {(loading ? demoProducts : featured).slice(0, 8).map((product) => (
                <div
                  key={product.id}
                  className="min-w-[280px] max-w-[280px] snap-start"
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TRENDING / MOST LOVED tabs ── */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Shop What&apos;s Hot
              </p>
              <h2 className="mt-2 text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Trending now
              </h2>
            </div>
            <Tabs defaultValue="trending" className="w-auto">
              <TabsList>
                <TabsTrigger value="trending">Trending</TabsTrigger>
                <TabsTrigger value="loved">Most loved</TabsTrigger>
                <TabsTrigger value="new">Just in</TabsTrigger>
              </TabsList>
              <TabsContent value="trending" />
              <TabsContent value="loved" />
              <TabsContent value="new" />
            </Tabs>
          </div>

          <Tabs defaultValue="trending" className="w-full">
            <TabsContent value="trending" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(loading ? demoProducts : featured).slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="loved" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {demoProducts.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </TabsContent>
            <TabsContent value="new" className="mt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {newArrivals.slice(0, 4).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* ── DARK INVERTED BAND: Quote + Newsletter + Instagram ── */}
      <section className="bg-foreground text-background">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <Quote className="h-10 w-10 text-background/60 mb-4" />
              <p className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight tracking-tight">
                &ldquo;The quality and curation here is unmatched. Every order feels
                like opening a gift I chose for myself.&rdquo;
              </p>
              <p className="mt-6 text-sm uppercase tracking-widest text-background/60">
                — Maya R. · Verified buyer
              </p>
            </div>
            <div className="bg-background text-foreground p-8">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                Newsletter
              </p>
              <h3 className="mt-2 text-2xl font-bold">Get 10% off</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Your first order, plus early access to new drops and curated edits.
              </p>
              <div className="mt-6 flex gap-2">
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="flex-1 h-11 px-3 bg-background border border-input text-sm outline-none focus:border-foreground transition-colors"
                />
                <Button>Subscribe</Button>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
            {instaImages.map((src, i) => (
              <a
                key={i}
                href="#"
                className="aspect-square bg-background/10 overflow-hidden block hover:opacity-80 transition-opacity"
              >
                <img src={src} alt="" className="w-full h-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section className="bg-foreground text-background border-t border-background/10">
        <div className="mx-auto max-w-7xl px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <s.icon className="h-8 w-8 text-background/80" />
                <div>
                  <p className="text-3xl md:text-4xl font-bold">{s.value}</p>
                  <p className="text-xs text-background/60 uppercase tracking-widest mt-1">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BRANDS GRID ── */}
      {!loading && brands.length > 0 && (
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-4 py-20">
            <div className="text-center mb-12">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Trusted Brands
              </p>
              <h2 className="mt-2 text-3xl md:text-5xl font-bold text-foreground tracking-tight">
                Shop by brand
              </h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {brands.slice(0, 4).map((brand) => (
                <Link
                  key={brand.id}
                  to={`/products?brandId=${brand.id}`}
                  className="group relative overflow-hidden border border-border p-8 text-center hover:border-foreground transition-colors"
                >
                  <p className="text-base font-bold text-foreground uppercase tracking-wider">
                    {brand.name}
                  </p>
                  {brand.description && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {brand.description}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── CTA ── */}
      <section>
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Get Started
          </p>
          <h2 className="mt-3 text-3xl md:text-5xl font-bold text-foreground tracking-tight">
            Ready to start shopping?
          </h2>
          <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto">
            Join thousands of happy customers. Get access to exclusive deals and new arrivals.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => navigate('/register')}>
              Create Account <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/products')}>
              Browse Products
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}