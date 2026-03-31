import { Link } from 'react-router';
import { ShoppingBag, Heart, MapPin, Star, User } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuthStore } from '../../store/auth-store';
import { orders, wishlists, addresses } from '../../lib/mock-data';

export function AccountPage() {
  const { user } = useAuthStore();
  const userOrders = orders.filter(o => o.userId === user?.id);
  const userWishlists = wishlists.filter(w => w.userId === user?.id);
  const userAddresses = addresses.filter(a => a.userId === user?.id);

  const stats = [
    { label: 'Orders', value: userOrders.length, icon: ShoppingBag, link: '/account/orders' },
    { label: 'Wishlists', value: userWishlists.length, icon: Heart, link: '/account/wishlists' },
    { label: 'Addresses', value: userAddresses.length, icon: MapPin, link: '/account/addresses' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Account Overview</h1>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} to={stat.link}>
              <Card className="transition-shadow hover:shadow-lg">
                <CardContent className="flex items-center gap-4 p-6">
                  <div className="rounded-full bg-primary/10 p-3">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>View and update your account details</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div>
                <dt className="text-sm text-muted-foreground">Name</dt>
                <dd className="font-semibold">{user?.name}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Email</dt>
                <dd className="font-semibold">{user?.email}</dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Phone</dt>
                <dd className="font-semibold">{user?.phone || 'Not provided'}</dd>
              </div>
            </dl>
            <Button asChild className="mt-4 w-full">
              <Link to="/account/profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>View your order history</CardDescription>
          </CardHeader>
          <CardContent>
            {userOrders.length > 0 ? (
              <div className="space-y-3">
                {userOrders.slice(0, 3).map((order) => (
                  <div key={order.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-semibold">{order.orderNumber}</p>
                      <p className="text-sm text-muted-foreground">{order.status}</p>
                    </div>
                    <p className="font-bold">${order.total.toFixed(2)}</p>
                  </div>
                ))}
                <Button asChild variant="outline" className="w-full">
                  <Link to="/account/orders">View All Orders</Link>
                </Button>
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">No orders yet</p>
                <Button asChild>
                  <Link to="/products">Start Shopping</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
