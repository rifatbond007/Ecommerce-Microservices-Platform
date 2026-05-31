import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminOrdersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Order Management</h1>
      <Card><CardHeader><CardTitle>All Orders</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">Order list coming soon.</p></CardContent></Card>
    </div>
  );
}
