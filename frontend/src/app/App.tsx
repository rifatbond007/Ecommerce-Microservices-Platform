import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuthStore } from '@/store/auth-store';
import { useCartStore } from '@/store/cart-store';
import { RootLayout } from './layouts/root-layout';
import { Toaster } from '@/components/ui/toast';
import { HomePage } from './pages/home-page';
import { LoginPage } from './pages/auth/login-page';
import { RegisterPage } from './pages/auth/register-page';
import { ForgotPasswordPage } from './pages/forgot-password-page';
import { ResetPasswordPage } from './pages/reset-password-page';
import { VerifyEmailPage } from './pages/verify-email-page';
import { ProductsPage } from './pages/product-listing-page';
import { ProductDetailPage } from './pages/product-detail-page';
import { ProductReviewsPage } from './pages/product-reviews-page';
import { SearchPage } from './pages/search-page';
import { CategoriesPage } from './pages/categories-page';
import { CartPage } from './pages/user/cart-page';
import { CheckoutPage } from './pages/checkout-page';
import { ProfilePage } from './pages/user/profile-page';
import { OrdersPage } from './pages/user/orders-page';
import { OrderDetailPage } from './pages/user/order-detail-page';
import { AddressesPage } from './pages/user/addresses-page';
import { WishlistsPage } from './pages/user/wishlists-page';
import { NotificationsPage } from './pages/notifications-page';
import { NotificationPreferencesPage } from './pages/notification-preferences-page';
import { SavedCartsPage } from './pages/saved-carts-page';
import { BecomeSellerPage } from './pages/become-seller-page';
import { SellerDashboardPage } from './pages/seller/seller-dashboard-page';
import { SellerProductsPage } from './pages/seller/seller-products-page';
import { AdminDashboardPage } from './pages/admin/admin-dashboard-page';
import { AdminUsersPage } from './pages/admin/admin-users-page';
import { AdminProductsPage } from './pages/admin/admin-products-page';
import { AdminOrdersPage } from './pages/admin/admin-orders-page';

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] as const } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2 } },
};

function PageWrap({ children }: { children: React.ReactNode }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || user?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function SellerRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated || user?.sellerStatus !== 'APPROVED') return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  const { checkAuth } = useAuthStore();
  const { fetchCart } = useCartStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth().then(() => fetchCart());
  }, [checkAuth, fetchCart]);

  return (
    <Toaster>
      <RootLayout>
        <AnimatePresence mode="wait">
          <PageWrap key={location.pathname}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/products/:productId/reviews" element={<ProductReviewsPage />} />
              <Route path="/categories" element={<CategoriesPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/cart" element={<ProtectedRoute><CartPage /></ProtectedRoute>} />
              <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
              <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
              <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
              <Route path="/addresses" element={<ProtectedRoute><AddressesPage /></ProtectedRoute>} />
              <Route path="/wishlists" element={<ProtectedRoute><WishlistsPage /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />
              <Route path="/notifications/preferences" element={<ProtectedRoute><NotificationPreferencesPage /></ProtectedRoute>} />
              <Route path="/saved-carts" element={<ProtectedRoute><SavedCartsPage /></ProtectedRoute>} />
              <Route path="/become-seller" element={<ProtectedRoute><BecomeSellerPage /></ProtectedRoute>} />
              <Route path="/seller" element={<SellerRoute><SellerDashboardPage /></SellerRoute>} />
              <Route path="/seller/products" element={<SellerRoute><SellerProductsPage /></SellerRoute>} />
              <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
              <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
              <Route path="/admin/products" element={<AdminRoute><AdminProductsPage /></AdminRoute>} />
              <Route path="/admin/orders" element={<AdminRoute><AdminOrdersPage /></AdminRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </PageWrap>
        </AnimatePresence>
      </RootLayout>
    </Toaster>
  );
}
