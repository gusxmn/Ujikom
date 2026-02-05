'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { LogIn, User, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-lg text-gray-600">
            Choose your login type to continue
          </p>
        </div>

        {/* Customer Login */}
        <div className="w-full max-w-md mx-auto mb-8">
          <Link href="/login/customer" className="group">
            <Card className="hover:shadow-xl transition-all duration-300 hover:border-blue-300 cursor-pointer">
              <CardHeader className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-4 mx-auto group-hover:bg-blue-200 transition">
                  <User className="w-10 h-10 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Login</CardTitle>
                <CardDescription>
                  Sign in to your account
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Browse products, manage orders, and track your purchases
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>✓ Browse Products</li>
                  <li>✓ Manage Orders</li>
                  <li>✓ Wishlist & Cart</li>
                  <li>✓ Track Shipments</li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 group">
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Footer */}
        <div className="text-center space-y-3">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              href="/register"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
