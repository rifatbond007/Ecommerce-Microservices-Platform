import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { adminApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Users, Package, ShoppingCart, DollarSign, Activity } from 'lucide-react';

interface Stats {
  totalUsers: number;
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
}

interface SalePoint {
  date: string;
  amount: number;
}

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

const chartVariants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: (i: number) => ({
    scaleY: 1,
    opacity: 1,
    transition: {
      delay: i * 0.03,
      type: 'spring' as const,
      stiffness: 200,
      damping: 18,
    },
  }),
};

const statCards = [
  {
    label: 'Total Users',
    icon: Users,
    value: (s: Stats) => s.totalUsers,
    gradient: 'from-indigo-500 to-blue-600',
  },
  {
    label: 'Total Products',
    icon: Package,
    value: (s: Stats) => s.totalProducts,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    label: 'Total Orders',
    icon: ShoppingCart,
    value: (s: Stats) => s.totalOrders,
    gradient: 'from-violet-500 to-purple-600',
  },
  {
    label: 'Total Revenue',
    icon: DollarSign,
    value: (s: Stats) => `$${(s.totalRevenue ?? 0).toFixed(2)}`,
    gradient: 'from-emerald-500 to-teal-600',
  },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [sales, setSales] = useState<SalePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, salesRes] = await Promise.all([
        adminApi.getStats(),
        adminApi.getActivity(),
      ]);
      setStats(statsRes.data);
      setSales(Array.isArray(salesRes.data) ? salesRes.data : []);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-9 w-56 mb-6" />
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-3" />
                <Skeleton className="h-8 w-12" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-5 w-32 mb-4" />
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-destructive mb-4">{error}</p>
        <Button onClick={fetchData} className="rounded-full">Retry</Button>
      </div>
    );
  }

  const maxAmount = Math.max(...sales.map((s) => s.amount), 1);

  return (
    <motion.div
      className="container mx-auto px-4 py-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants} className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Platform overview and analytics</p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5 text-sm">
          <Activity className="h-4 w-4" />
          Live
        </Badge>
      </motion.div>

      <motion.div variants={itemVariants} className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-3xl font-bold text-white">
                    {stats ? card.value(stats) : 0}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </motion.div>

      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Sales Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sales.length === 0 ? (
              <div className="text-center py-12">
                <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No sales data available yet.</p>
              </div>
            ) : (
              <motion.div
                className="flex items-end gap-2 h-48"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {sales.map((s, i) => (
                  <motion.div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
                    variants={chartVariants}
                    custom={i}
                    style={{ originY: 1 }}
                  >
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-blue-400 rounded-t transition-all hover:from-amber-500 hover:to-orange-400"
                      style={{ height: `${Math.max((s.amount / maxAmount) * 100, 2)}%` }}
                      title={`$${s.amount.toFixed(2)}`}
                    />
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
