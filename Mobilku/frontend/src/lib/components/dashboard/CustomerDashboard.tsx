'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { Button } from '@/lib/components/ui/Button';
import Link from 'next/link';
import { ShoppingBag, Heart, User, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { formatPrice, formatDate, getFirstImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const { user } = useAuth();

  // Fetch user orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data || [];
    },
  });

  // Fetch cart items
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data || [];
    },
  });

  // Fetch wishlist items
  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await api.get('/wishlist');
      return response.data || [];
    },
  });

  const recentOrders = orders?.slice(0, 5) || [];
  const cartItemCount = cart?.length || 0;
  const wishlistItemCount = wishlist?.length || 0;

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <section>
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg p-8">
          <h1 className="text-4xl font-bold mb-2">Selamat Datang, {user?.name}! 👋</h1>
          <p className="text-blue-100">Kelola pesanan, wishlist, dan preferensi belanja Anda di sini</p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Total Pesanan</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{orders?.length || 0}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Keranjang Belanja</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{cartItemCount}</p>
              </div>
              <ShoppingBag className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Wishlist</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{wishlistItemCount}</p>
              </div>
              <Heart className="w-12 h-12 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">Profil</p>
                <p className="text-sm text-gray-900 mt-1 font-medium">{user?.role}</p>
              </div>
              <User className="w-12 h-12 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Recent Orders */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Pesanan Terbaru</h2>
          <Link href="/orders">
            <Button variant="outline">Lihat Semua</Button>
          </Link>
        </div>

        {ordersLoading ? (
          <div className="animate-pulse space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        ) : recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map((order: any) => {
              return (
              <Card key={order.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatPrice(order.totalAmount)}</p>
                      <div className="mt-2 flex items-center gap-2">
                        {order.status === 'DELIVERED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            Terkirim
                          </span>
                        ) : order.status === 'CANCELLED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-100 px-3 py-1 rounded-full">
                            <AlertCircle className="w-3 h-3" />
                            Dibatalkan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full">
                            <Clock className="w-3 h-3" />
                            {order.status}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">Anda belum memiliki pesanan</p>
              <Link href="/products">
                <Button className="mt-4">Mulai Belanja</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Cart & Wishlist Preview */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Cart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Keranjang Belanja
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartLoading ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
            ) : cartItemCount > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Anda memiliki <span className="font-bold">{cartItemCount}</span> item dalam keranjang
                </p>
                <Link href="/cart">
                  <Button className="w-full">Lihat Keranjang</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">Keranjang belanja kosong</p>
                <Link href="/products">
                  <Button className="mt-4" variant="outline">
                    Jelajahi Produk
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Wishlist */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              Wishlist Saya
            </CardTitle>
          </CardHeader>
          <CardContent>
            {wishlistLoading ? (
              <div className="animate-pulse h-20 bg-gray-200 rounded"></div>
            ) : wishlistItemCount > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Anda memiliki <span className="font-bold">{wishlistItemCount}</span> item dalam wishlist
                </p>
                <Link href="/wishlist">
                  <Button className="w-full">Lihat Wishlist</Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm">Wishlist masih kosong</p>
                <Link href="/products">
                  <Button className="mt-4" variant="outline">
                    Jelajahi Produk
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Quick Actions */}
      <section>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Aksi Cepat</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/products">
            <Button className="w-full py-6 text-lg">
              <ShoppingBag className="mr-2 w-5 h-5" />
              Belanja Sekarang
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="outline" className="w-full py-6 text-lg">
              <User className="mr-2 w-5 h-5" />
              Edit Profil
            </Button>
          </Link>
          <Link href="/orders">
            <Button variant="outline" className="w-full py-6 text-lg">
              <Clock className="mr-2 w-5 h-5" />
              Riwayat Pesanan
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
