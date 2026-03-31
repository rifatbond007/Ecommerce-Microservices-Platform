import { createBrowserRouter, Navigate } from 'react-router';
import { useAuthStore } from './store/auth-store';

// Layouts
import { RootLayout } from './layouts/root-layout';
import { DashboardLayout } from './layouts/dashboard-layout';

// Public Pages
import { HomePage } from './pages/home-page';
import { ProductListingPage } from './pages/product-listing-page';
import { ProductDetailPage } from './pages/product-detail-page';
import { SearchPage } from './pages/search-page';

// Auth Pages
import { LoginPage } from './pages/auth/login-page';
import { RegisterPage } from './pages/auth/register-page';
import { ForgotPasswordPage } from './pages/auth/forgot-password-page';

// User Pages
import { CartPage } from './pages/user/cart-page';
import { CheckoutPage } from './pages/user/checkout-page';
import { AccountPage } from './pages/user/account-page';
import { ProfilePage } from './pages/user/profile-page';
import { AddressesPage } from './pages/user/addresses-page';
import { WishlistsPage } from './pages/user/wishlists-page';
import { OrdersPage } from './pages/user/orders-page';
import { OrderDetailPage } from './pages/user/order-detail-page';
import { ReviewsPage } from './pages/user/reviews-page';
import { BecomeSellerPage } from './pages/user/become-seller-page';

// Seller Pages
import { SellerDashboardPage } from './pages/seller/seller-dashboard-page';
import { SellerProductsPage } from './pages/seller/seller-products-page';
import { SellerProductFormPage } from './pages/seller/seller-product-form-page';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/admin-dashboard-page';
import { AdminUsersPage } from './pages/admin/admin-users-page';
import { AdminProductsPage } from './pages/admin/admin-products-page';
import { AdminOrdersPage } from './pages/admin/admin-orders-page';
import { AdminSellerRequestsPage } from './pages/admin/admin-seller-requests-page';

// Protected Route Component
function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: 'user' | 'seller' | 'admin' }) {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  if (requiredRole === 'seller' && user.role !== 'seller' && user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'products', element: <ProductListingPage /> },
      { path: 'products/:slug', element: <ProductDetailPage /> },
      { path: 'category/:slug', element: <ProductListingPage /> },
      { path: 'brand/:slug', element: <ProductListingPage /> },
      { path: 'search', element: <SearchPage /> },
      
      // Auth
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      
      // Cart (accessible to all)
      { path: 'cart', element: <CartPage /> },
      
      // User Dashboard
      {
        path: 'account',
        element: <ProtectedRoute><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <AccountPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'addresses', element: <AddressesPage /> },
          { path: 'wishlists', element: <WishlistsPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/:id', element: <OrderDetailPage /> },
          { path: 'reviews', element: <ReviewsPage /> },
          { path: 'become-seller', element: <BecomeSellerPage /> },
        ],
      },
      
      // Checkout
      { path: 'checkout', element: <ProtectedRoute><CheckoutPage /></ProtectedRoute> },
      
      // Seller Dashboard
      {
        path: 'seller',
        element: <ProtectedRoute requiredRole="seller"><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <SellerDashboardPage /> },
          { path: 'products', element: <SellerProductsPage /> },
          { path: 'products/new', element: <SellerProductFormPage /> },
          { path: 'products/:id/edit', element: <SellerProductFormPage /> },
        ],
      },
      
      // Admin Dashboard
      {
        path: 'admin',
        element: <ProtectedRoute requiredRole="admin"><DashboardLayout /></ProtectedRoute>,
        children: [
          { index: true, element: <AdminDashboardPage /> },
          { path: 'users', element: <AdminUsersPage /> },
          { path: 'products', element: <AdminProductsPage /> },
          { path: 'orders', element: <AdminOrdersPage /> },
          { path: 'seller-requests', element: <AdminSellerRequestsPage /> },
        ],
      },
    ],
  },
]);
