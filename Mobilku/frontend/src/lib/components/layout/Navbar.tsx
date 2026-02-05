'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Car, LogOut, User, ShoppingCart, Heart } from 'lucide-react';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  // Hide navbar for admin users
  if (isAdmin) {
    return null;
  }

  // Show only logo navbar on login and register pages
  const isAuthPage = pathname?.includes('/login') || pathname?.includes('/register');
  if (isAuthPage) {
    return (
      <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
            <Car className="w-6 h-6" />
            Mobilku
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
          <Car className="w-6 h-6" />
          Mobilku
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-gray-600 hover:text-gray-900 transition">
            Home
          </Link>
          <Link href="/products" className="text-gray-600 hover:text-gray-900 transition">
            Products
          </Link>
        </div>

        {/* User Menu */}
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link href="/wishlist" className="text-gray-600 hover:text-gray-900">
                <Heart className="w-5 h-5" />
              </Link>
              <Link href="/cart" className="relative text-gray-600 hover:text-gray-900">
                <ShoppingCart className="w-5 h-5" />
              </Link>
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                >
                  <User className="w-5 h-5 text-gray-600" />
                  <span className="hidden sm:inline text-gray-700 font-medium">{user.name}</span>
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-lg py-2 w-48 z-10">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/orders"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Orders
                    </Link>
                    <Link
                      href="/wishlist"
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
                    >
                      Wishlist
                    </Link>
                    <hr className="my-2" />
                    <button
                      onClick={() => {
                        logout();
                        setIsMenuOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-gray-600 hover:text-gray-900 transition"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
