'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { ShoppingCart, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">Kelola item belanja Anda</p>
        </div>

        {/* Empty Cart */}
        <div className="text-center py-16">
          <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-gray-700 mb-3">Keranjang Belanja Kosong</h2>
          <p className="text-gray-600 mb-8">Mulai belanja untuk menambahkan item ke keranjang</p>
          <Link href="/products">
            <Button variant="primary" className="gap-2">
              Lihat Produk
            </Button>
          </Link>
        </div>

        {/* Cart Summary */}
        <Card className="max-w-md mx-auto mt-12">
          <CardHeader>
            <CardTitle>Ringkasan Pesanan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-semibold">Rp 0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Ongkos Kirim</span>
              <span className="font-semibold">Rp 0</span>
            </div>
            <div className="border-t border-gray-200 pt-4 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="text-xl font-bold text-blue-600">Rp 0</span>
            </div>
            <Button
              disabled
              fullWidth
              className="mt-4"
            >
              Proses Checkout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
