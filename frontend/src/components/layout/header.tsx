import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, Bell, Store, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { api } from '@/lib/api';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/notifications').then(r => {
      const notifs = r.data.notifications || [];
      setUnreadNotifications(notifs.filter((n: any) => !n.readAt).length);
    }).catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">E-Commerce</span>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/products" className="text-sm font-medium transition-colors hover:text-primary">Products</Link>
          <Link to="/categories" className="text-sm font-medium transition-colors hover:text-primary">Categories</Link>
          <Link to="/search" className="text-sm font-medium transition-colors hover:text-primary">Search</Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/search')}>
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>

          {isAuthenticated ? (
            <>
              <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
                <Bell className="h-5 w-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-xs text-destructive-foreground flex items-center justify-center">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Button>

              <div className="relative">
                <Button variant="ghost" size="icon" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                  <User className="h-5 w-5" />
                </Button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-md border bg-background shadow-lg z-20">
                      <div className="p-3 border-b">
                        <p className="text-sm font-medium truncate">{user?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{user?.role}{user?.sellerStatus === 'APPROVED' ? ' · Seller' : ''}</p>
                      </div>
                      <div className="p-1">
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/profile'); setUserMenuOpen(false); }}>Profile</button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/orders'); setUserMenuOpen(false); }}>Orders</button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/addresses'); setUserMenuOpen(false); }}>Addresses</button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/wishlists'); setUserMenuOpen(false); }}>Wishlists</button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/saved-carts'); setUserMenuOpen(false); }}>Saved Carts</button>
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/notifications/preferences'); setUserMenuOpen(false); }}>Notification Settings</button>
                        {user?.sellerStatus === 'APPROVED' && (
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/seller'); setUserMenuOpen(false); }}>
                            <Store className="h-4 w-4" /> Seller Dashboard
                          </button>
                        )}
                        {user?.sellerStatus !== 'APPROVED' && user?.sellerStatus !== 'PENDING' && (
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/become-seller'); setUserMenuOpen(false); }}>
                            <Store className="h-4 w-4" /> Become a Seller
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors" onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}>
                            <LayoutDashboard className="h-4 w-4" /> Admin Dashboard
                          </button>
                        )}
                        <hr className="my-1" />
                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md hover:bg-destructive/10 text-destructive transition-colors" onClick={() => { handleLogout(); setUserMenuOpen(false); }}>
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          )}

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto flex flex-col space-y-2 px-4 py-4">
            <Link to="/products" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Products</Link>
            <Link to="/categories" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Categories</Link>
            <Link to="/search" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Search</Link>
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Cart ({cartCount})</Link>
                <Link to="/orders" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link to="/profile" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                <hr />
                {user?.sellerStatus === 'APPROVED' && <Link to="/seller" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Seller Dashboard</Link>}
                {user?.sellerStatus !== 'APPROVED' && user?.sellerStatus !== 'PENDING' && <Link to="/become-seller" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Become a Seller</Link>}
                {user?.role === 'admin' && <Link to="/admin" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>}
                <button className="text-sm font-medium py-1 text-destructive text-left" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>Logout</button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium py-1" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}