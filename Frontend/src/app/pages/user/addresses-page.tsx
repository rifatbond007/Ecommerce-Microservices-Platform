import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { MapPin, Plus } from 'lucide-react';
import { addresses } from '../../lib/mock-data';
import { useAuthStore } from '../../store/auth-store';

export function AddressesPage() {
  const { user } = useAuthStore();
  const userAddresses = addresses.filter(a => a.userId === user?.id);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Addresses</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Address
        </Button>
      </div>

      {userAddresses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {userAddresses.map((address) => (
            <Card key={address.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>{address.name}</span>
                  {address.isDefault && <Badge>Default</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>{address.city}, {address.state} {address.zipCode}</p>
                  <p>{address.country}</p>
                  <p className="text-muted-foreground">{address.phone}</p>
                </div>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline">Edit</Button>
                  <Button size="sm" variant="outline">Delete</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <MapPin className="mb-4 h-16 w-16 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-bold">No addresses saved</h2>
            <p className="mb-6 text-muted-foreground">Add an address to get started</p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Address
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
