'use client';

import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';

export function Header() {
  const { isAuthenticated, logout } = useAuthStore();

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-2xl font-bold">
          E-Commerce
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/products" className="hover:text-blue-600">
            Products
          </Link>
          <Link href="/search" className="hover:text-blue-600">
            Search
          </Link>

          {isAuthenticated ? (
            <>
              <Link href="/cart" className="hover:text-blue-600">
                Cart
              </Link>
              <Link href="/orders" className="hover:text-blue-600">
                Orders
              </Link>
              <Link href="/wishlist" className="hover:text-blue-600">
                Wishlist
              </Link>
              <Link href="/profile" className="hover:text-blue-600">
                Profile
              </Link>
              <button
                onClick={logout}
                className="text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}