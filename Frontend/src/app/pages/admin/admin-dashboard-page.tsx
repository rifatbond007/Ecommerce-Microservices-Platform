import { Users, Package, ShoppingCart, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { users, products, orders } from '../../lib/mock-data';

export function AdminDashboardPage() {
  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  
  const stats = [
    { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600' },
    { label: 'Total Products', value: products.length, icon: Package, color: 'text-green-600' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingCart, color: 'text-purple-600' },
    { label: 'Revenue', value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: 'text-amber-600' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Platform activity and analytics will appear here</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-muted-foreground">Manage your platform from here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
