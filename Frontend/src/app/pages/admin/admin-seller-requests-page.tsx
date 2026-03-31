import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

export function AdminSellerRequestsPage() {
  // Mock seller requests
  const requests = [
    { id: '1', name: 'John Doe', email: 'john@example.com', businessName: 'John\'s Store', date: '2024-03-25' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com', businessName: 'Fashion World', date: '2024-03-26' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">Seller Requests</h1>

      <div className="space-y-4">
        {requests.length > 0 ? (
          requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{request.businessName}</h3>
                    <p className="text-sm text-muted-foreground">{request.name} ({request.email})</p>
                    <p className="text-xs text-muted-foreground">Requested on {request.date}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="text-green-600">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button size="sm" variant="outline" className="text-red-600">
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <p className="text-muted-foreground">No pending seller requests</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
