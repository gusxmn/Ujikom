'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardContent } from '@/lib/components/ui/Card';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/lib/components/ui/Button';
import Link from 'next/link';
import CartPage from '@/lib/components/cart/page';

export default function CartPageWrapper() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 flex items-center justify-center">
        <Card className="max-w-md bg-white shadow-xl">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Please Login</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your cart
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1">
                <Button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">Login</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button variant="outline" className="w-full border-slate-300 hover:bg-blue-50">Register</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <CartPage />;
}
