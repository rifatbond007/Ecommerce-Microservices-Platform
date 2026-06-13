import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, Search, LogOut, Bell, Store, LayoutDashboard, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    api.get('/notifications').then(r => {
      const notifs = r.data.notifications || [];
      setUnreadNotifications(notifs.filter((n: any) => !n.readAt).length);
    }).catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

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
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-primary-foreground font-bold text-sm group-hover:scale-105 transition-transform">
            E
          </div>
          <span className="text-lg font-bold tracking-tight">Market</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {['Products', 'Categories'].map((item) => (
            <Link
              key={item}
              to={`/${item.toLowerCase()}`}
              className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-md hover:bg-muted/50 transition-all"
            >
              {item}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setSearchOpen(true)}>
            <Search className="h-5 w-5" />
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => navigate('/cart')}>
            <ShoppingCart className="h-5 w-5" />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center shadow-lg"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Button>

          {isAuthenticated && (
            <Button variant="ghost" size="icon" className="rounded-full relative" onClick={() => navigate('/notifications')}>
              <Bell className="h-5 w-5" />
              <AnimatePresence>
                {unreadNotifications > 0 && (
                  <motion.span
                    key={unreadNotifications}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center shadow-lg"
                  >
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </motion.span>
                )}
              </AnimatePresence>
            </Button>
          )}

          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setDark(!dark)}>
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          {isAuthenticated ? (
            <div className="relative">
              <Button variant="ghost" size="icon" className="rounded-full" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Button>
              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl border bg-background shadow-xl z-20 overflow-hidden"
                    >
                      <div className="p-3 bg-gradient-to-r from-primary/5 to-transparent">
                        <p className="text-sm font-semibold truncate">{user?.email}</p>
                        <p className="text-xs text-muted-foreground capitalize mt-0.5">
                          {user?.role?.replace('_', ' ')}
                          {user?.sellerStatus === 'APPROVED' ? ' · Seller' : ''}
                        </p>
                      </div>
                      <Separator />
                      <div className="p-1.5 space-y-0.5">
                        {[
                          { label: 'Profile', path: '/profile', icon: User },
                          { label: 'Orders', path: '/orders', icon: ShoppingCart },
                          { label: 'Notifications', path: '/notifications', icon: Bell },
                        ].map(({ label, path, icon: Icon }) => (
                          <button
                            key={label}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                            onClick={() => { navigate(path); setUserMenuOpen(false); }}
                          >
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            {label}
                          </button>
                        ))}
                        <Separator />
                        {user?.sellerStatus === 'APPROVED' && (
                          <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                            onClick={() => { navigate('/seller'); setUserMenuOpen(false); }}
                          >
                            <Store className="h-4 w-4 text-muted-foreground" /> Seller Dashboard
                          </button>
                        )}
                        {(!user?.sellerStatus || user?.sellerStatus === 'NONE') && (
                          <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                            onClick={() => { navigate('/become-seller'); setUserMenuOpen(false); }}
                          >
                            <Store className="h-4 w-4 text-muted-foreground" /> Become a Seller
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors"
                            onClick={() => { navigate('/admin'); setUserMenuOpen(false); }}
                          >
                            <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Admin Dashboard
                          </button>
                        )}
                        <Separator />
                        <button
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                          onClick={() => { handleLogout(); setUserMenuOpen(false); }}
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Button onClick={() => navigate('/login')} className="rounded-full px-5">
              Sign In
            </Button>
          )}

          <Button variant="ghost" size="icon" className="rounded-full md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t overflow-hidden md:hidden"
          >
            <nav className="container mx-auto flex flex-col px-4 py-4 gap-1">
              {['Products', 'Categories', 'Search'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </Link>
              ))}
              <Separator />
              {isAuthenticated ? (
                <>
                  <Link to="/cart" className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)}>Cart ({cartCount})</Link>
                  <Link to="/orders" className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)}>Orders</Link>
                  <Link to="/profile" className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)}>Profile</Link>
                  {user?.sellerStatus === 'APPROVED' && (
                    <Link to="/seller" className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)}>Seller Dashboard</Link>
                  )}
                  {(!user?.sellerStatus || user?.sellerStatus === 'NONE') && (
                    <Link to="/become-seller" className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)}>Become a Seller</Link>
                  )}
                  {user?.role === 'admin' && (
                    <Link to="/admin" className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)}>Admin Dashboard</Link>
                  )}
                  <Separator />
                  <button className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-destructive/10 text-destructive text-left transition-colors" onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>
                    Logout
                  </button>
                </>
              ) : (
                <Link to="/login" className="px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-muted transition-colors" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
          >
            <div className="container mx-auto px-4 pt-20">
              <motion.div
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="max-w-2xl mx-auto"
              >
                <form onSubmit={handleSearch} className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search products, categories, brands..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-primary/20 bg-background text-lg outline-none focus:border-primary transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setSearchOpen(false)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                  >
                    <X className="h-5 w-5 text-muted-foreground" />
                  </button>
                </form>
                <p className="text-center text-sm text-muted-foreground mt-3">
                  Press <kbd className="px-1.5 py-0.5 rounded border bg-muted text-xs">Esc</kbd> to close
                </p>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
