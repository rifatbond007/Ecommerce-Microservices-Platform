import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Users, Package, ShoppingCart, DollarSign, Activity,
  ArrowRight, UserPlus, Box, RefreshCw, Settings,
} from 'lucide-react';
import { adminApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface StatsData {
  users: { total: number; new: number };
  products: { total: number; new: number };
  orders: { total: number; revenue: number };
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  details?: string;
  createdAt: string;
}

const navLinks = [
  { label: 'Dashboard', path: '/admin', icon: Activity },
  { label: 'Users', path: '/admin/users', icon: Users },
  { label: 'Products', path: '/admin/products', icon: Package },
  { label: 'Orders', path: '/admin/orders', icon: ShoppingCart },
  { label: 'Settings', path: '/admin/settings', icon: Settings },
];

const ORDER_STATUS_COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--muted-foreground))'];

const statCards = [
  {
    label: 'Total Users', icon: Users,
    value: (s: StatsData) => s.users.total,
    sub: (s: StatsData) => `+${s.users.new} this period`,
  },
  {
    label: 'Total Products', icon: Package,
    value: (s: StatsData) => s.products.total,
    sub: (s: StatsData) => `+${s.products.new} this period`,
  },
  {
    label: 'Total Orders', icon: ShoppingCart,
    value: (s: StatsData) => s.orders.total,
    sub: () => 'Lifetime orders',
  },
  {
    label: 'Revenue', icon: DollarSign,
    value: (s: StatsData) => `$${(s.orders.revenue ?? 0).toLocaleString()}`,
    sub: () => 'Total revenue',
  },
];

// Mock chart data — backend doesn't expose time-series yet
const revenueSeries = Array.from({ length: 12 }).map((_, i) => ({
  month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
  revenue: Math.round(2000 + Math.sin(i) * 800 + i * 350),
}));

const orderStatusBreakdown = [
  { name: 'Delivered', value: 320 },
  { name: 'Shipped', value: 145 },
  { name: 'Processing', value: 89 },
  { name: 'Pending', value: 56 },
  { name: 'Cancelled', value: 23 },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const r = await adminApi.getStats();
      setStats(r.data as unknown as StatsData);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const newEntries = stats ? [
    { label: 'New Users', value: stats.users.new, icon: UserPlus },
    { label: 'New Products', value: stats.products.new, icon: Box },
    { label: 'Orders', value: stats.orders.total, icon: ShoppingCart },
  ] : [];

  const maxBarValue = Math.max(...newEntries.map((b) => b.value), 1);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex gap-8">
        <AdminSidebar current="/admin" />

        <div className="flex-1 min-w-0 space-y-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
              Admin Panel
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold text-foreground tracking-tight">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Platform overview and analytics.
            </p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={load}>
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {loading ? (
            <Card>
              <CardContent className="p-8 text-sm text-muted-foreground">
                Loading dashboard…
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Stat tiles */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {statCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <Card key={card.label}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardDescription className="text-[10px] font-bold uppercase tracking-widest">
                            {card.label}
                          </CardDescription>
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <CardTitle className="text-2xl font-bold font-mono">
                          {stats ? card.value(stats) : 0}
                        </CardTitle>
                        <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                          {stats ? card.sub(stats) : ''}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Charts row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest">
                      Trend
                    </CardDescription>
                    <CardTitle>Revenue (12 mo)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueSeries}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 8,
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="hsl(var(--primary))"
                            strokeWidth={2}
                            dot={{ fill: 'hsl(var(--primary))', r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardDescription className="text-xs font-bold uppercase tracking-widest">
                      Mix
                    </CardDescription>
                    <CardTitle>Order status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={orderStatusBreakdown}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            innerRadius={45}
                            outerRadius={80}
                            paddingAngle={2}
                          >
                            {orderStatusBreakdown.map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={ORDER_STATUS_COLORS[idx % ORDER_STATUS_COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--popover))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: 8,
                            }}
                          />
                          <Legend
                            verticalAlign="bottom"
                            iconType="circle"
                            wrapperStyle={{ fontSize: 11 }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Period breakdown */}
              <Card>
                <CardHeader>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">
                    This Period
                  </CardDescription>
                  <CardTitle>New entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-6 h-40 border-b border-border pb-2">
                    {newEntries.map((bar) => {
                      const heightPct = Math.max((bar.value / maxBarValue) * 100, 4);
                      const Icon = bar.icon;
                      return (
                        <div
                          key={bar.label}
                          className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                        >
                          <span className="text-xs font-bold text-foreground font-mono">
                            {bar.value}
                          </span>
                          <div
                            className="w-full bg-primary transition-all duration-500 ease-out"
                            style={{ height: `${heightPct}%` }}
                          />
                          <div className="flex items-center gap-1">
                            <Icon className="h-3 w-3 text-muted-foreground" />
                            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                              {bar.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Recent activity */}
              <Card>
                <CardHeader>
                  <CardDescription className="text-xs font-bold uppercase tracking-widest">
                    Recent
                  </CardDescription>
                  <CardTitle>Activity log</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                    <div className="divide-y divide-border">
                      {stats.recentActivity.slice(0, 10).map((item) => (
                        <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                          <Activity className="h-3 w-3 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-foreground font-bold uppercase tracking-wider truncate">
                              {item.action}
                            </p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">
                              {item.entityType}
                              {item.entityId ? ` #${item.entityId.slice(0, 8)}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                            {new Date(item.createdAt).toLocaleDateString('en-US', {
                              month: 'short', day: 'numeric',
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        No recent activity
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ current }: { current: string }) {
  const navigate = useNavigate();

  return (
    <nav className="hidden md:flex flex-col w-48 shrink-0 border border-border bg-card h-fit">
      <div className="px-5 py-4 border-b border-border">
        <p className="text-xs font-bold text-foreground uppercase tracking-widest">Admin</p>
      </div>
      {navLinks.map((link) => {
        const Icon = link.icon;
        const active = link.path === current;
        return (
          <button
            key={link.label}
            onClick={() => navigate(link.path)}
            className={`flex items-center gap-3 px-5 py-3 text-xs font-bold uppercase tracking-wider text-left transition-all ${
              active
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {link.label}
            {active && <ArrowRight className="h-3 w-3 ml-auto" />}
          </button>
        );
      })}
    </nav>
  );
}