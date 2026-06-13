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
    gradient: 'from-indigo-500 to-blue-600',
    lightBg: 'bg-indigo-50',
  },
  {
    label: 'Total Orders',
    icon: ShoppingCart,
    value: (s: { orders: number }) => s.orders,
    gradient: 'from-amber-500 to-orange-600',
    lightBg: 'bg-amber-50',
  },
  {
    label: 'Revenue',
    icon: DollarSign,
    value: (s: { revenue: number }) => `$${s.revenue.toFixed(2)}`,
    gradient: 'from-emerald-500 to-teal-600',
    lightBg: 'bg-emerald-50',
  },
];

export function SellerDashboardPage() {
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchStats = async () => {
      try {
        const productsRes = await sellerApi.getProducts();
        if (cancelled) return;
        const products = productsRes.data.products?.length || 0;
        setStats({ products, orders: 0, revenue: 0 });
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

      <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="overflow-hidden border-0 shadow-sm">
              <CardContent className="p-0">
                <div className={`bg-gradient-to-br ${card.gradient} p-6`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-white/80">{card.label}</p>
                    <Icon className="h-5 w-5 text-white/70" />
                  </div>
                  <p className="text-3xl font-bold text-white">{card.value(stats)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants} className="flex gap-4">
        <Link to="/seller/products">
          <Button size="lg" className="rounded-full">
            <Package className="mr-2 h-4 w-4" /> Manage Products
          </Button>
        </Link>
        <Link to="/seller/products">
          <Button variant="outline" size="lg" className="rounded-full">
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
}
