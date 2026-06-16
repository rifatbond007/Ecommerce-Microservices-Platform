import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, Bell, Store, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { api } from '@/lib/api';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#e5e5e5] bg-white">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold tracking-widest text-[#111111] uppercase">
          Market
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {['Products', 'Categories'].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="text-xs font-bold uppercase tracking-widest text-[#666666] hover:text-[#111111] transition-colors"
            >
              {item}
            </Link>
          ))}
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(true)}>
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/cart')}>
            <ShoppingCart className="h-4 w-4" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#111111] text-white text-[9px] font-bold flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Button>
          {isAuthenticated && (
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate('/notifications')}>
              <Bell className="h-4 w-4" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#111111] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </Button>
          )}
          {isAuthenticated ? (
            <div className="relative">
              <Button variant="ghost" size="icon" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-[#111111] text-white text-[10px] font-bold">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-2 w-56 border border-[#e5e5e5] bg-white z-20">
                    <div className="p-3 border-b border-[#e5e5e5]">
                      <p className="text-sm font-bold text-[#111111] truncate">{user?.email}</p>
                      <p className="text-xs text-[#666666] uppercase tracking-wider mt-0.5">
                        {user?.role?.replace('_', ' ')}
                        {user?.sellerStatus === 'APPROVED' ? ' · SELLER' : ''}
                      </p>
                    </div>
                    <div className="p-1">
                      {[
                        { label: 'Profile', path: '/profile', icon: User },
                        { label: 'Orders', path: '/orders', icon: ShoppingCart },
                      ].map(({ label, path, icon: Icon }) => (
                        <button
                          key={label}
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors"
                          onClick={() => { navigate(path); setUserMenuOpen(false); }}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                      {user?.sellerStatus === 'APPROVED' && (
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors"
                          onClick={() => { navigate('/seller'); setUserMenuOpen(false); }}
                        >
                          <Store className="h-3.5 w-3.5" /> Seller Dashboard
                        </button>
                      )}
                      {(!user?.sellerStatus || user?.sellerStatus === 'NONE') && (
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors"
                          onClick={() => { navigate('/become-seller'); setUserMenuOpen(false); }}
                        >
                          <Store className="h-3.5 w-3.5" /> Become a Seller
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button
                          className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors"
                          onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}
                        >
                          <LayoutDashboard className="h-3.5 w-3.5" /> Admin Dashboard
                        </button>
                      )}
                    </div>
                    <div className="border-t border-[#e5e5e5] p-1">
                      <button
                        className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors"
                        onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                      >
                        <LogOut className="h-3.5 w-3.5" /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Button size="sm" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          )}
          <button
            className="md:hidden p-2 text-[#111111]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-[#e5e5e5] md:hidden">
          <nav className="mx-auto max-w-5xl flex flex-col px-6 py-4 gap-1">
            {['Products', 'Categories', 'Search'].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <Separator className="my-2 bg-[#e5e5e5]" />
            {isAuthenticated ? (
              <>
                <Link to="/cart" className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors" onClick={() => setMobileMenuOpen(false)}>Cart ({cartCount})</Link>
                <Link to="/orders" className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                <Link to="/profile" className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                {user?.sellerStatus === 'APPROVED' && (
                  <Link to="/seller" className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors" onClick={() => setMobileMenuOpen(false)}>Seller Dashboard</Link>
                )}
                {(!user?.sellerStatus || user?.sellerStatus === 'NONE') && (
                  <Link to="/become-seller" className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors" onClick={() => setMobileMenuOpen(false)}>Become a Seller</Link>
                )}
                {user?.role === 'admin' && (
                  <Link to="/admin" className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                )}
                <button className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] text-left transition-colors" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                  Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-[#666666] hover:text-[#111111] hover:bg-[#f5f5f5] transition-colors" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            )}
          </nav>
        </div>
      )}

      {searchOpen && (
        <div className="fixed inset-0 z-50 bg-white/95">
          <div className="mx-auto max-w-2xl px-6 pt-24">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#666666]" />
              <input
                autoFocus
                type="text"
                placeholder="SEARCH PRODUCTS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 pl-11 pr-12 border border-[#e5e5e5] bg-white text-sm text-[#111111] font-bold uppercase tracking-wider outline-none focus:border-[#111111] transition-colors"
              />
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666666] hover:text-[#111111] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </form>
            <p className="text-center text-xs text-[#666666] mt-3 uppercase tracking-wider">
              Press Esc to close
            </p>
          </div>
        </div>
      )}
    </header>
  );
}
