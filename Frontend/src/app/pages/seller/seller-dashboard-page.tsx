import { Package, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

export function SellerDashboardPage() {
  const stats = [
    { label: 'Total Products', value: '12', icon: Package, color: 'text-blue-600' },
    { label: 'Total Sales', value: '$2,450', icon: DollarSign, color: 'text-green-600' },
    { label: 'Orders', value: '45', icon: ShoppingCart, color: 'text-purple-600' },
    { label: 'Revenue', value: '+12%', icon: TrendingUp, color: 'text-amber-600' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Seller Dashboard</h1>

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

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Your recent sales and product activity will appear here</p>
        </CardContent>
      </Card>
    </div>
  );
}
