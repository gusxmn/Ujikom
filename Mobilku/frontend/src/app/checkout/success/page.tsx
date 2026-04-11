'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { Button } from '@/lib/components/ui/Button';
import { ArrowLeft, CheckCircle, Clock, XCircle } from 'lucide-react';
import { usePaymentStatus } from '@/lib/hooks/usePaymentStatus';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatPrice } from '@/lib/utils';

export default function OrderSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = parseInt(searchParams.get('orderId') || '0');

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);

  // Payment status polling
  const { 
    data: paymentData, 
    status: paymentStatus, 
    isLoading: paymentLoading,
    isCompleted: paymentCompleted,
    isFailed: paymentFailed,
    isExpired: paymentExpired,
    isPending: paymentPending,
  } = usePaymentStatus({
    orderId: orderId,
    enabled: orderId > 0,
    refetchInterval: 10000, // Check every 10 seconds
    onStatusChange: (newStatus) => {
      console.log('💳 Payment status changed:', newStatus);
      
      if (newStatus === 'completed') {
        toast.success('✅ Pembayaran berhasil! Pesanan diproses.');
        setRedirecting(true);
        setTimeout(() => {
          router.push(`/orders/${orderId}`);
        }, 2000);
      } else if (newStatus === 'failed') {
        toast.error('❌ Pembayaran gagal. Silakan coba lagi.');
      } else if (newStatus === 'expired') {
        toast.error('⏰ Invoice sudah kadaluarsa. Buat invoice baru.');
      }
    }
  });

  useEffect(() => {
    if (!orderId) {
      toast.error('Order ID not provided');
      router.push('/orders');
      return;
    }

    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setOrder(response.data);
    } catch (error: any) {
      toast.error('Failed to load order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirmingPayment(true);
      console.log(`💳 Confirming payment for order ${orderId}`);
      
      const response = await api.post(`/payments/${orderId}/confirm`);
      
      toast.success('✅ Pembayaran berhasil dikonfirmasi!');
      console.log('Payment confirmed:', response.data);
      
      // Reload order data to update payment status
      await loadOrder();
    } catch (error: any) {
      toast.error('Gagal mengkonfirmasi pembayaran');
      console.error(error);
    } finally {
      setConfirmingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
          </div>
          <p className="text-gray-600">Memproses pesanan...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-gray-600">Pesanan tidak ditemukan</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-200 rounded-full animate-ping opacity-75"></div>
              <CheckCircle className="w-16 h-16 text-green-500 relative" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pesanan Berhasil Dibuat! 🎉</h1>
          <p className="text-gray-600">Order #{order.orderNumber}</p>
        </div>

        <div className="space-y-6">
          {/* Payment Status Alert */}
          {redirecting && (
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-green-700">
                  <CheckCircle className="w-5 h-5" />
                  <span>Pembayaran berhasil! Mengarahkan ke detail pesanan...</span>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentFailed && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-red-700">
                  <XCircle className="w-5 h-5" />
                  <span>Pembayaran gagal. Silakan buat invoice baru atau hubungi dukungan.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentExpired && (
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-orange-700">
                  <Clock className="w-5 h-5" />
                  <span>Invoice sudah kadaluarsa. Buat invoice baru di bawah ini.</span>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentPending && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-blue-700">
                    <Clock className="w-5 h-5 animate-spin" />
                    <span>Menunggu pembayaran... Sistem secara otomatis memeriksa status.</span>
                  </div>
                  <Button 
                    onClick={handleConfirmPayment}
                    disabled={confirmingPayment}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {confirmingPayment ? 'Mengonfirmasi...' : '✅ Konfirmasi Pembayaran (Testing)'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Order Details */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Detail Pesanan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Nomor Pesanan:</span>
                <span className="font-semibold text-gray-900">#{order.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Pembayaran:</span>
                <span className="font-semibold text-lg text-gray-900">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-semibold capitalize text-gray-900">{order.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Alamat Pengiriman:</span>
                <span className="text-sm text-right text-gray-900">
                  {order.shippingAddress 
                    ? `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.province}`
                    : 'Tidak ada alamat'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Link href="/orders" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <ArrowLeft className="w-4 h-4" />
                Lihat Pesanan
              </Button>
            </Link>
            <Link href="/" className="flex-1">
              <Button className="w-full">Lanjut Belanja</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
