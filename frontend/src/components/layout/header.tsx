import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { cn } from '@/lib/utils';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">E-Commerce</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/products" className="text-sm font-medium transition-colors hover:text-primary">
            Products
          </Link>
          <Link to="/search" className="text-sm font-medium transition-colors hover:text-primary">
            Search
          </Link>
        </nav>

        {/* Right Side */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <Button variant="ghost" size="icon" onClick={() => navigate('/search')}>
            <Search className="h-5 w-5" />
          </Button>

          {/* Cart */}
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>

          {/* Auth */}
          {isAuthenticated ? (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <User className="h-5 w-5" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-background shadow-lg">
                  <div className="p-2">
                    <p className="px-2 py-1 text-sm font-medium">{user?.email}</p>
                    <p className="px-2 py-1 text-xs text-muted-foreground">{user?.role}</p>
                  </div>
                  <div className="border-t">
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm"
                      onClick={() => navigate('/profile')}
                    >
                      Profile
                    </Button>
                    {user?.role === 'admin' && (
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-sm"
                        onClick={() => navigate('/admin')}
                      >
                        Admin
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      className="w-full justify-start text-sm text-destructive"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Button onClick={() => navigate('/login')}>Sign In</Button>
          )}

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto flex flex-col space-y-2 px-4 py-4">
            <Link to="/products" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Products
            </Link>
            <Link to="/search" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
              Search
            </Link>
            {!isAuthenticated && (
              <Button onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Sign In</Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
