import { Outlet, Link, useLocation } from 'react-router';
import { useAuthStore } from '../store/auth-store';
import { 
  User, 
  MapPin, 
  Heart, 
  ShoppingBag, 
  Star, 
  Store,
  LayoutDashboard,
  Package,
  Users,
  Settings,
  FileText
} from 'lucide-react';
import { cn } from '../components/ui/utils';

export function DashboardLayout() {
  const { user } = useAuthStore();
  const location = useLocation();

  const userLinks = [
    { to: '/account', label: 'Overview', icon: LayoutDashboard },
    { to: '/account/profile', label: 'Profile', icon: User },
    { to: '/account/addresses', label: 'Addresses', icon: MapPin },
    { to: '/account/wishlists', label: 'Wishlists', icon: Heart },
    { to: '/account/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/account/reviews', label: 'Reviews', icon: Star },
    { to: '/account/become-seller', label: 'Become a Seller', icon: Store },
  ];

  const sellerLinks = [
    { to: '/seller', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/seller/products', label: 'My Products', icon: Package },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/admin/users', label: 'Users', icon: Users },
    { to: '/admin/products', label: 'Products', icon: Package },
    { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
    { to: '/admin/seller-requests', label: 'Seller Requests', icon: FileText },
  ];

  let links = userLinks;
  if (location.pathname.startsWith('/seller')) {
    links = sellerLinks;
  } else if (location.pathname.startsWith('/admin')) {
    links = adminLinks;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[250px_1fr]">
        <aside className="space-y-1">
          <div className="mb-4 px-3 py-2">
            <h2 className="text-lg font-semibold">
              {location.pathname.startsWith('/seller') && 'Seller Dashboard'}
              {location.pathname.startsWith('/admin') && 'Admin Dashboard'}
              {!location.pathname.startsWith('/seller') && !location.pathname.startsWith('/admin') && 'My Account'}
            </h2>
            <p className="text-sm text-muted-foreground">{user?.name}</p>
          </div>
          <nav className="space-y-1">
            {links.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.to;
              
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
