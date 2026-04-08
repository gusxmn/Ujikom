'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  Calendar,
  CreditCard,
  Truck,
  AlertCircle,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: any;
  product: {
    id: number;
    name: string;
    price: any;
    image: string;
  };
}

interface Payment {
  id: number;
  orderId: number;
  amount: any;
  method: string;
  status: string;
  transactionId?: string;
  createdAt: string;
}

interface OrderDetail {
  id: number;
  orderNumber: string;
  userId: number;
  totalAmount: any;
  status: string;
  shippingAddress: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
  items: OrderItem[];
  payments: Payment[];
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  const { user, isLoading: authLoading } = useAuth();

  // Fetch order details
  const { data: order, isLoading, error, refetch } = useQuery<OrderDetail>({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    },
    enabled: !!orderId && !!user,
  });

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      toast.error('Unauthorized access');
      router.push('/');
    }
  }, [user, authLoading, router]);

  const getStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case 'SHIPPED':
        return 'bg-indigo-100 text-indigo-800 border border-indigo-300';
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const upperStatus = status?.toUpperCase();
    switch (upperStatus) {
      case 'PAID':
      case 'SUCCESS':
        return 'bg-green-100 text-green-800 border border-green-300';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      case 'FAILED':
        return 'bg-red-100 text-red-800 border border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-300';
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-800 font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Error loading order details
            </p>
            <p className="text-red-600 text-sm mt-2">{error?.message}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="mb-6 gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <p className="text-yellow-800 font-semibold">Order not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600 mt-1">
                Ordered on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-lg font-semibold text-lg ${getStatusColor(order.status)}`}>
            {order.status}
          </div>
        </div>

        {/* Order Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-semibold text-gray-900">{order.user.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-semibold text-gray-900">{order.user.email}</p>
              </div>
            </CardContent>
          </Card>

          {/* Order Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Order Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Order Number</p>
                <p className="font-semibold text-gray-900">{order.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-semibold text-gray-900">{formatDate(order.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Address */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-900 whitespace-pre-line">{order.shippingAddress}</p>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items ({order.items.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">Product ID: {item.product.id}</p>
                    <p className="text-sm text-gray-600 mt-2">
                      Quantity: <span className="font-semibold">{item.quantity}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Unit Price</p>
                    <p className="font-semibold text-gray-900">{formatPrice(item.price)}</p>
                    <p className="text-sm text-gray-600 mt-2">Subtotal</p>
                    <p className="font-bold text-lg text-blue-600">
                      {formatPrice(Number(item.price) * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary Totals */}
            <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
              <div className="flex justify-between text-gray-900">
                <span>Subtotal:</span>
                <span className="font-semibold">{formatPrice(order.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-2xl font-bold text-blue-600 pt-3 border-t border-gray-200">
                <span>Total:</span>
                <span>{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        {order.payments && order.payments.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.payments.map((payment) => (
                  <div key={payment.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <p className="font-semibold text-gray-900">Payment #{payment.id}</p>
                      <div className={`px-3 py-1 rounded-md text-sm font-semibold ${getPaymentStatusColor(payment.status)}`}>
                        {payment.status}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">Method</p>
                        <p className="font-semibold text-gray-900">{payment.method}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Amount</p>
                        <p className="font-bold text-lg text-green-600">{formatPrice(payment.amount)}</p>
                      </div>
                      {payment.transactionId && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600">Transaction ID</p>
                          <p className="font-mono text-sm text-gray-900">{payment.transactionId}</p>
                        </div>
                      )}
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Payment Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(payment.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        {order.notes && (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-900 whitespace-pre-line">{order.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
