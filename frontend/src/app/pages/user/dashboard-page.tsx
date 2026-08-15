import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  Heart,
  Bell,
  MapPin,
  ArrowRight,
  ShoppingBag,
  Eye,
  Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { userApi, orderApi, notificationApi } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { getErrorMessage } from '@/lib/api';

interface Counts {
  orders: number;
  unread: number;
  wishlists: number;
  addresses: number;
}

export function DashboardPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [counts, setCounts] = useState<Counts>({
    orders: 0,
    unread: 0,
    wishlists: 0,
    addresses: 0,
  });
  const [recentOrders, setRecentOrders] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const [ordersRes, notifRes, wishlistsRes, addressesRes] = await Promise.allSettled([
          orderApi.getOrders({ limit: 5 }),
          notificationApi.list({ limit: 50 }),
          userApi.getWishlists(),
          userApi.getAddresses(),
        ]);

        if (cancelled) return;

        const ordersData =
          ordersRes.status === 'fulfilled' ? (ordersRes.value.data as { orders?: unknown[]; total?: number }) : null;
        const notifData =
          notifRes.status === 'fulfilled'
            ? (notifRes.value.data as { notifications?: Array<{ readAt?: string | null }>; total?: number })
            : null;
        const wishlistsData =
          wishlistsRes.status === 'fulfilled' ? (wishlistsRes.value.data as { wishlists?: unknown[] }) : null;
        const addressesData =
          addressesRes.status === 'fulfilled' ? (addressesRes.value.data as { addresses?: unknown[] }) : null;

        setRecentOrders(ordersData?.orders ?? []);
        setCounts({
          orders: ordersData?.total ?? ordersData?.orders?.length ?? 0,
          unread:
            notifData?.notifications?.filter((n) => !n.readAt).length ?? 0,
          wishlists: wishlistsData?.wishlists?.length ?? 0,
          addresses: addressesData?.addresses?.length ?? 0,
        });
      } catch (err) {
        toast({
          title: 'Failed to load dashboard',
          description: getErrorMessage(err),
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const firstName = user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      {/* Greeting */}
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Welcome back
          </p>
          <h1 className="mt-1 text-4xl md:text-5xl font-bold tracking-tight text-foreground">
            Hi, {firstName}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here&apos;s everything you need at a glance.
          </p>
        </div>
        <Button asChild>
          <Link to="/products">
            <Sparkles className="mr-2 h-4 w-4" />
            Discover something new
          </Link>
        </Button>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        <StatTile
          label="Orders"
          value={counts.orders}
          icon={Package}
          href="/orders"
          loading={loading}
        />
        <StatTile
          label="Unread"
          value={counts.unread}
          icon={Bell}
          href="/notifications"
          loading={loading}
        />
        <StatTile
          label="Wishlists"
          value={counts.wishlists}
          icon={Heart}
          href="/wishlists"
          loading={loading}
        />
        <StatTile
          label="Addresses"
          value={counts.addresses}
          icon={MapPin}
          href="/addresses"
          loading={loading}
        />
      </div>

      {/* Quick actions */}
      <section className="mb-12">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Quick actions
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <QuickAction
            label="Track an order"
            description="See latest status and tracking"
            href="/orders"
            icon={Package}
          />
          <QuickAction
            label="Browse products"
            description="Find your next favorite thing"
            href="/products"
            icon={ShoppingBag}
          />
          <QuickAction
            label="Manage profile"
            description="Update personal info and password"
            href="/profile"
            icon={Eye}
          />
        </div>
      </section>

      {/* Recent orders */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Recent orders
          </h2>
          <Link
            to="/orders"
            className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground inline-flex items-center"
          >
            View all <ArrowRight className="ml-1 h-3 w-3" />
          </Link>
        </div>
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-sm text-muted-foreground">Loading…</div>
            ) : recentOrders.length === 0 ? (
              <div className="p-12 text-center">
                <Package className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No orders yet.</p>
                <Button asChild className="mt-4">
                  <Link to="/products">Start shopping</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentOrders.slice(0, 5).map((o) => {
                  const order = o as {
                    id: string;
                    orderNumber?: string;
                    status?: string;
                    total?: number;
                    createdAt?: string;
                  };
                  return (
                    <Link
                      key={order.id}
                      to={`/orders/${order.id}`}
                      className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          #{order.orderNumber ?? order.id.slice(0, 8)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString()
                            : '—'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {order.status ?? 'pending'}
                        </span>
                        <span className="text-sm font-bold">
                          ${Number(order.total ?? 0).toFixed(2)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

interface StatTileProps {
  label: string;
  value: number;
  icon: typeof Package;
  href: string;
  loading: boolean;
}

function StatTile({ label, value, icon: Icon, href, loading }: StatTileProps) {
  return (
    <Link to={href}>
      <Card className="transition-all hover:border-foreground hover:shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs font-bold uppercase tracking-widest">
              {label}
            </CardDescription>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <CardTitle className="text-3xl font-bold tracking-tight">
            {loading ? '—' : value}
          </CardTitle>
        </CardContent>
      </Card>
    </Link>
  );
}

interface QuickActionProps {
  label: string;
  description: string;
  href: string;
  icon: typeof Package;
}

function QuickAction({ label, description, href, icon: Icon }: QuickActionProps) {
  return (
    <Link
      to={href}
      className="group flex items-start gap-4 border border-border p-5 transition-all hover:border-foreground hover:bg-muted/50"
    >
      <div className="flex h-10 w-10 items-center justify-center border border-foreground bg-primary text-primary-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-bold text-foreground uppercase tracking-wider">
          {label}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
    </Link>
  );
}