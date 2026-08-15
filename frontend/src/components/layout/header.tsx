import { Link, useNavigate } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Menu,
  Search,
  LogOut,
  Bell,
  Store,
  LayoutDashboard,
  Heart,
  MapPin,
  Settings,
  Package,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { notificationApi } from '@/lib/api';

export function Header() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();
  const { items } = useCartStore();
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadNotifications(0);
      return;
    }
    notificationApi
      .list({ limit: 50 })
      .then((res: unknown) => {
        const data = res as { notifications?: Array<{ readAt?: string | null }> };
        const notifs = data.notifications || [];
        setUnreadNotifications(notifs.filter((n) => !n.readAt).length);
      })
      .catch(() => {});
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const userInitial = user?.email?.charAt(0).toUpperCase() || 'U';

  const homePath = isAuthenticated ? '/dashboard' : '/';

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link
          to={homePath}
          className="text-xl font-bold tracking-widest text-foreground uppercase"
        >
          Market
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: 'Products', path: '/products' },
              { label: 'Categories', path: '/categories' },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.path}
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
            <SearchCommand onNavigate={(p) => navigate(p)} />
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              aria-label={`Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}`}
              onClick={() => navigate('/cart')}
            >
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-full">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label={`Notifications, ${unreadNotifications} unread`}
                onClick={() => navigate('/notifications')}
              >
                <Bell className="h-4 w-4" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center rounded-full">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </Button>
            )}
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Account menu"
                  >
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-bold">
                        {userInitial}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-bold truncate">{user?.email}</p>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">
                      {user?.role?.replace('_', ' ')}
                      {user?.sellerStatus === 'APPROVED' ? ' · SELLER' : ''}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-3.5 w-3.5" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}>
                    <Package className="mr-2 h-3.5 w-3.5" />
                    Orders
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/wishlists')}>
                    <Heart className="mr-2 h-3.5 w-3.5" />
                    Wishlists
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/addresses')}>
                    <MapPin className="mr-2 h-3.5 w-3.5" />
                    Addresses
                  </DropdownMenuItem>
                  {user?.sellerStatus === 'APPROVED' ? (
                    <DropdownMenuItem onClick={() => navigate('/seller')}>
                      <Store className="mr-2 h-3.5 w-3.5" />
                      Seller Dashboard
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => navigate('/become-seller')}>
                      <Store className="mr-2 h-3.5 w-3.5" />
                      Become a Seller
                    </DropdownMenuItem>
                  )}
                  {user?.role === 'admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <LayoutDashboard className="mr-2 h-3.5 w-3.5" />
                      Admin Dashboard
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <Settings className="mr-2 h-3.5 w-3.5" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-3.5 w-3.5" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => navigate('/login')}>
                Sign In
              </Button>
            )}
          </nav>

          {/* Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle>
                  <Link
                    to={homePath}
                    className="text-xl font-bold tracking-widest text-foreground uppercase"
                  >
                    Market
                  </Link>
                </SheetTitle>
              </SheetHeader>
              <nav className="mt-6 flex flex-col gap-1">
                <SearchCommand
                  onNavigate={(p) => navigate(p)}
                  variant="mobile"
                />
                {[
                  { label: 'Products', path: '/products' },
                  { label: 'Categories', path: '/categories' },
                  { label: 'Cart', path: '/cart' },
                ].map((item) => (
                  <Link
                    key={item.label}
                    to={item.path}
                    className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
                <Separator className="my-2" />
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/orders"
                      className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Orders
                    </Link>
                    <Link
                      to="/profile"
                      className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      Profile
                    </Link>
                    {user?.sellerStatus === 'APPROVED' && (
                      <Link
                        to="/seller"
                        className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Seller Dashboard
                      </Link>
                    )}
                    {(!user?.sellerStatus || user?.sellerStatus === 'NONE') && (
                      <Link
                        to="/become-seller"
                        className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Become a Seller
                      </Link>
                    )}
                    {user?.role === 'admin' && (
                      <Link
                        to="/admin"
                        className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      >
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted text-left transition-colors"
                      onClick={handleLogout}
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    Sign In
                  </Link>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

interface SearchCommandProps {
  onNavigate: (path: string) => void;
  variant?: 'desktop' | 'mobile';
}

function SearchCommand({ onNavigate, variant = 'desktop' }: SearchCommandProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (variant === 'desktop') {
      const down = (e: KeyboardEvent) => {
        if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpen((o) => !o);
        }
      };
      document.addEventListener('keydown', down);
      return () => document.removeEventListener('keydown', down);
    }
  }, [variant]);

  const submit = useCallback(() => {
    if (query.trim()) {
      onNavigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setOpen(false);
      setQuery('');
    }
  }, [query, onNavigate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open search"
        onClick={() => setOpen(true)}
        className={variant === 'mobile' ? 'w-full justify-start px-3' : ''}
      >
        <Search className="h-4 w-4" />
        {variant === 'mobile' && (
          <span className="ml-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Search
          </span>
        )}
      </Button>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command>
          <CommandInput
            placeholder="SEARCH PRODUCTS..."
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') submit();
            }}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => onNavigate('/products')}>
                <Search className="mr-2 h-4 w-4" />
                Browse all products
              </CommandItem>
              <CommandItem onSelect={() => onNavigate('/categories')}>
                <Search className="mr-2 h-4 w-4" />
                Browse categories
              </CommandItem>
              {query.trim() && (
                <CommandItem onSelect={submit}>
                  <Search className="mr-2 h-4 w-4" />
                  Search for "{query}"
                </CommandItem>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}