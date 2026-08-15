import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { sellerApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingCart, DollarSign, Plus, TrendingUp } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 20 },
  },
};

const statCards = [
  {
    label: 'Total Products',
    icon: Package,
    value: (s: { products: number }) => s.products,
  },
  {
    label: 'Total Orders',
    icon: ShoppingCart,
    value: (s: { orders: number }) => s.orders,
  },
  {
    label: 'Revenue',
    icon: DollarSign,
    value: (s: { revenue: number }) => `$${s.revenue.toFixed(2)}`,
  },
  {
    label: 'Rating',
    icon: TrendingUp,
    value: (s: { rating: number }) => s.rating?.toFixed(1) ?? '—',
  },
];

interface SellerStats {
  products: number;
  orders: number;
  revenue: number;
  rating: number;
}

export function SellerDashboardPage() {
  const [stats, setStats] = useState<SellerStats>({
    products: 0,
    orders: 0,
    revenue: 0,
    rating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const res = await sellerApi.getStats();
        if (cancelled) return;
        const data = (res.data ?? {}) as Partial<SellerStats>;
        setStats({
          products: data.products ?? 0,
          orders: data.orders ?? 0,
          revenue: data.revenue ?? 0,
          rating: data.rating ?? 0,
        });
      } catch {
        if (!cancelled) setError('Failed to load dashboard stats');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-64 mb-6" />
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-24 mb-3" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Seller Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your store performance</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <TrendingUp className="h-4 w-4" />
          Live
        </Badge>
      </motion.div>

      {error && (
        <motion.p variants={itemVariants} className="text-sm text-destructive mb-4 bg-destructive/10 px-4 py-2 rounded-lg">
          {error}
        </motion.p>
      )}

      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold tracking-tight">{card.value(stats)}</p>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
        <Link to="/seller/products">
          <Button size="lg">
            <Package className="mr-2 h-4 w-4" /> Manage Products
          </Button>
        </Link>
        <Link to="/seller/products">
          <Button variant="outline" size="lg">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
