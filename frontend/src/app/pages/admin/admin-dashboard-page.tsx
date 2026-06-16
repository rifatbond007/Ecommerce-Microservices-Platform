import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi } from '@/lib/api';
import {
  Users, Package, ShoppingCart, DollarSign, Activity,
  ArrowRight, UserPlus, Box,
} from 'lucide-react';

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
];

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
    sub: (s: StatsData) => `+${s.orders.total} total`,
  },
  {
    label: 'Revenue', icon: DollarSign,
    value: (s: StatsData) => `$${(s.orders.revenue ?? 0).toLocaleString()}`,
    sub: () => 'Total revenue',
  },
];

export function AdminDashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    adminApi.getStats()
      .then(r => setStats(r.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const chartBars = stats ? [
    { label: 'New Users', value: stats.users.new, icon: UserPlus },
    { label: 'New Products', value: stats.products.new, icon: Box },
  ] : [];

  const maxBarValue = Math.max(...chartBars.map(b => b.value), 1);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex gap-8">
          <AdminSidebar current="/admin" />
          <div className="flex-1 border border-[#e5e5e5] bg-white p-8">
            <p className="text-xs text-[#666666] uppercase tracking-wider">Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex gap-8">
          <AdminSidebar current="/admin" />
          <div className="flex-1 border border-[#e5e5e5] bg-white p-8 text-center">
            <p className="text-xs text-[#666666] mb-4 uppercase tracking-wider">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-xs font-bold uppercase tracking-widest text-[#111111] border border-[#111111] px-4 py-2 hover:bg-[#111111] hover:text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex gap-8">
        <AdminSidebar current="/admin" />

        <div className="flex-1 min-w-0">
          <div className="border border-[#e5e5e5] bg-white">
            <div className="px-8 py-10 border-b border-[#e5e5e5]">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                Admin Panel
              </p>
              <h1 className="mt-3 text-2xl md:text-3xl font-bold text-[#111111]">
                Dashboard
              </h1>
              <p className="mt-2 text-xs text-[#666666] uppercase tracking-wider">
                Platform overview and analytics
              </p>
            </div>

            <div className="px-8 py-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {statCards.map(card => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="border border-[#e5e5e5] bg-white p-5">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#777777]">
                          {card.label}
                        </p>
                        <Icon className="h-4 w-4 text-[#111111]" />
                      </div>
                      <p className="text-2xl font-bold text-[#111111] font-mono">
                        {stats ? card.value(stats) : 0}
                      </p>
                      <p className="mt-1 text-[10px] text-[#666666] uppercase tracking-wider">
                        {stats ? card.sub(stats) : ''}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="mb-10">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                      This Period
                    </p>
                    <h2 className="mt-1 text-sm font-bold text-[#111111] uppercase tracking-wider">
                      New Entries
                    </h2>
                  </div>
                </div>
                <div className="flex items-end gap-6 h-40 border-b border-[#e5e5e5] pb-2">
                  {chartBars.map(bar => {
                    const heightPct = Math.max((bar.value / maxBarValue) * 100, 4);
                    return (
                      <div key={bar.label} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                        <span className="text-xs font-bold text-[#111111] font-mono">
                          {bar.value}
                        </span>
                        <div
                          className="w-full bg-[#111111] transition-all duration-500 ease-out"
                          style={{ height: `${heightPct}%` }}
                        />
                        <div className="flex items-center gap-1">
                          <bar.icon className="h-3 w-3 text-[#666666]" />
                          <span className="text-[10px] text-[#666666] uppercase tracking-wider">
                            {bar.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#777777]">
                      Recent
                    </p>
                    <h2 className="mt-1 text-sm font-bold text-[#111111] uppercase tracking-wider">
                      Activity Log
                    </h2>
                  </div>
                </div>
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  <div className="border border-[#e5e5e5] divide-y divide-[#e5e5e5]">
                    {stats.recentActivity.slice(0, 10).map((item) => (
                      <div key={item.id} className="flex items-center gap-4 px-4 py-3">
                        <Activity className="h-3 w-3 text-[#666666] shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#111111] font-bold uppercase tracking-wider truncate">
                            {item.action}
                          </p>
                          <p className="text-[10px] text-[#666666] uppercase tracking-wider mt-0.5">
                            {item.entityType}{item.entityId ? ` #${item.entityId.slice(0, 8)}` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-[#666666] font-mono shrink-0">
                          {new Date(item.createdAt).toLocaleDateString('en-US', {
                            month: 'short', day: 'numeric',
                          })}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-[#e5e5e5] p-6 text-center">
                    <p className="text-xs text-[#666666] uppercase tracking-wider">No recent activity</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-8 py-4 bg-[#fafafa] border-t border-[#e5e5e5] text-center">
              <p className="text-xs text-[#777777] uppercase tracking-wider">
                Market — Admin Dashboard
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminSidebar({ current }: { current: string }) {
  const navigate = useNavigate();

  return (
    <nav className="hidden md:flex flex-col w-48 shrink-0 border border-[#e5e5e5] bg-white h-fit">
      <div className="px-5 py-4 border-b border-[#e5e5e5]">
        <p className="text-xs font-bold text-[#111111] uppercase tracking-widest">Admin</p>
      </div>
      {navLinks.map(link => {
        const Icon = link.icon;
        const active = link.path === current;
        return (
          <button
            key={link.label}
            onClick={() => navigate(link.path)}
            className={`flex items-center gap-3 px-5 py-3 text-xs font-bold uppercase tracking-wider text-left transition-all duration-200 ${
              active
                ? 'bg-[#111111] text-white'
                : 'text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5]'
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
