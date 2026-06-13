import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Sparkles, Truck, ShieldCheck, ArrowRight } from 'lucide-react';
import { productApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface Product {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images: string[];
  slug: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.1, 0.25, 1] as const } },
};

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
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/10 blur-3xl" />
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-1/4 right-1/4 h-4 w-4 rounded-full bg-primary/20"
          />
          <motion.div
            animate={{ y: [0, 15, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-1/3 left-1/3 h-6 w-6 rounded-full bg-accent/20"
          />
        </div>
        <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="max-w-3xl mx-auto text-center"
          >
            <Badge variant="secondary" className="mb-4 px-4 py-1.5 text-sm rounded-full">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" /> New Season Arrivals
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-balance">
              Discover Your{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Perfect Style
              </span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto">
              Shop the latest trends with confidence. Premium products, curated just for you.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="rounded-full px-8 h-12 text-base gap-2" onClick={() => navigate('/products')}>
                Shop Now <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8 h-12 text-base" onClick={() => navigate('/categories')}>
                Browse Categories
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              viewport={{ once: true }}
              className="flex items-center gap-3 rounded-xl border bg-background p-4 shadow-sm"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Featured Products</h2>
            <p className="text-muted-foreground mt-1">Handpicked just for you</p>
          </div>
          <Button variant="ghost" className="gap-2 rounded-full" onClick={() => navigate('/products')}>
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-square rounded-none" />
                <CardContent className="p-4 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-5 w-1/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            {products.map((product) => (
              <motion.div key={product.id} variants={item}>
                <Card className="group overflow-hidden border-0 bg-background shadow-sm hover:shadow-xl transition-all duration-300">
                  <Link to={`/products/${product.id}`}>
                    <div className="aspect-square bg-muted overflow-hidden relative">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          No Image
                        </div>
                      )}
                      {product.comparePrice && (
                        <Badge variant="destructive" className="absolute top-2 left-2">
                          -{Math.round((1 - product.price / product.comparePrice) * 100)}%
                        </Badge>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-4">
                    <Link to={`/products/${product.id}`}>
                      <h3 className="font-medium truncate group-hover:text-primary transition-colors">{product.name}</h3>
                    </Link>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">${product.price}</span>
                      {product.comparePrice && (
                        <span className="text-sm text-muted-foreground line-through">
                          ${product.comparePrice}
                        </span>
                      )}
                    </div>
                    <Button
                      className="w-full mt-3 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-1 group-hover:translate-y-0"
                      size="sm"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      Quick View
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Shopping?</h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join thousands of happy customers. Get access to exclusive deals and new arrivals.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button size="lg" className="rounded-full px-8 gap-2" onClick={() => navigate('/register')}>
                Create Account <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="lg" className="rounded-full px-8" onClick={() => navigate('/products')}>
                Browse Products
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer spacing */}
      <div className="h-4" />
    </div>
  );
}
