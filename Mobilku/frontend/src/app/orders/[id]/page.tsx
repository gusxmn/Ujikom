'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import {
  Clock,
  CheckCircle,
  Truck,
  Package,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Download,
  MessageSquare,
  RotateCw,
  X,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string;
  quantity: number;
  price: number;
}

interface Order {
  id: number;
  orderNumber: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  total: number;
  subtotal: number;
  shippingCost: number;
  shippingMethod: string;
  paymentMethod: string;
  items: OrderItem[];
  shippingAddress: {
    name: string;
    phone: string;
    email: string;
    street: string;
    city: string;
    province: string;
    zipCode: string;
    country: string;
  };
  trackingNumber?: string;
  estimatedDelivery?: string;
}

const STATUS_TIMELINE = {
  pending: [
    { step: 'pending', label: 'Order Placed', completed: true },
    { step: 'processing', label: 'Processing', completed: false },
    { step: 'shipped', label: 'Shipped', completed: false },
    { step: 'delivered', label: 'Delivered', completed: false },
  ],
  processing: [
    { step: 'pending', label: 'Order Placed', completed: true },
    { step: 'processing', label: 'Processing', completed: true },
    { step: 'shipped', label: 'Shipped', completed: false },
    { step: 'delivered', label: 'Delivered', completed: false },
  ],
  shipped: [
    { step: 'pending', label: 'Order Placed', completed: true },
    { step: 'processing', label: 'Processing', completed: true },
    { step: 'shipped', label: 'Shipped', completed: true },
    { step: 'delivered', label: 'Delivered', completed: false },
  ],
  delivered: [
    { step: 'pending', label: 'Order Placed', completed: true },
    { step: 'processing', label: 'Processing', completed: true },
    { step: 'shipped', label: 'Shipped', completed: true },
    { step: 'delivered', label: 'Delivered', completed: true },
  ],
  cancelled: [
    { step: 'pending', label: 'Order Placed', completed: true },
    { step: 'cancelled', label: 'Cancelled', completed: true },
  ],
};

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  processing: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { icon: X, color: 'text-red-600', bg: 'bg-red-100' },
};

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await api.get(`/orders/${orderId}`);
      return response.data as Order;
    },
  });

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${order?.orderNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled successfully');
    } catch (error) {
      toast.error('Failed to cancel order');
    }
  };

  const handleReorder = async () => {
    try {
      await api.post(`/orders/${orderId}/reorder`);
      toast.success('Items added to cart');
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 mt-20">
        <div className="max-w-4xl mx-auto px-4 animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 mt-20">
        <div className="max-w-4xl mx-auto px-4">
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-gray-600 text-lg">Order not found</p>
              <Link href="/orders" className="mt-4">
                <Button>Back to Orders</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const timeline = STATUS_TIMELINE[order.status];
  const statusConfig = STATUS_CONFIG[order.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50 py-8 mt-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
            <p className="text-gray-600 mt-2">Order #{order.orderNumber}</p>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${statusConfig.bg}`}>
            <StatusIcon size={20} className={statusConfig.color} />
            <span className={`font-semibold capitalize ${statusConfig.color}`}>
              {order.status}
            </span>
          </div>
        </div>

        {/* Timeline */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Order Status</h3>
            <div className="flex justify-between">
              {timeline.map((item, index) => (
                <div key={item.step} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      item.completed ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  >
                    <CheckCircle
                      size={20}
                      className={item.completed ? 'text-white' : 'text-gray-500'}
                    />
                  </div>
                  <p
                    className={`text-sm text-center ${
                      item.completed ? 'text-gray-900 font-semibold' : 'text-gray-600'
                    }`}
                  >
                    {item.label}
                  </p>
                  {index < timeline.length - 1 && (
                    <div
                      className={`h-1 mt-6 mb-2 flex-1 ${
                        timeline[index + 1].completed ? 'bg-green-600' : 'bg-gray-300'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tracking Info */}
        {order.status === 'shipped' && order.trackingNumber && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Truck size={24} className="text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Tracking Number</p>
                  <p className="text-lg font-semibold text-gray-900">{order.trackingNumber}</p>
                  {order.estimatedDelivery && (
                    <p className="text-sm text-gray-600 mt-1">
                      Estimated Delivery: {new Date(order.estimatedDelivery).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <div className="lg:col-span-2">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Items</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {order.items.map(item => (
                    <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                      <div className="relative w-20 h-20 bg-gray-100 rounded">
                        <Image
                          src={item.productImage || '/placeholder.png'}
                          alt={item.productName}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                      <div className="flex-1">
                        <Link
                          href={`/products/${item.productId}`}
                          className="font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {item.productName}
                        </Link>
                        <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                        <p className="font-semibold text-gray-900 mt-1">
                          {formatPrice(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin size={20} /> Shipping Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold text-gray-900">{order.shippingAddress.name}</p>
                <p className="text-gray-600 text-sm mt-2">{order.shippingAddress.street}</p>
                <p className="text-gray-600 text-sm">
                  {order.shippingAddress.city}, {order.shippingAddress.province}{' '}
                  {order.shippingAddress.zipCode}
                </p>
                <p className="text-gray-600 text-sm">{order.shippingAddress.country}</p>
                <div className="mt-4 space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-500" />
                    {order.shippingAddress.phone}
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-500" />
                    {order.shippingAddress.email}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Summary */}
          <div>
            {/* Order Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <p className="text-gray-600">Subtotal</p>
                  <p className="font-semibold">{formatPrice(order.subtotal)}</p>
                </div>
                <div className="flex justify-between">
                  <p className="text-gray-600">Shipping</p>
                  <p className="font-semibold">{formatPrice(order.shippingCost)}</p>
                </div>
                <hr />
                <div className="flex justify-between">
                  <p className="font-semibold text-gray-900">Total</p>
                  <p className="font-bold text-lg text-blue-600">{formatPrice(order.total)}</p>
                </div>
              </CardContent>
            </Card>

            {/* Details */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="text-gray-600">Order Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Shipping Method</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {order.shippingMethod}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Method</p>
                  <p className="font-semibold text-gray-900 capitalize">
                    {order.paymentMethod}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                fullWidth
                variant="outline"
                onClick={handleDownloadInvoice}
                className="flex items-center justify-center gap-2"
              >
                <Download size={18} /> Download Invoice
              </Button>
              {order.status === 'pending' || order.status === 'processing' ? (
                <Button
                  fullWidth
                  variant="destructive"
                  onClick={handleCancelOrder}
                  className="flex items-center justify-center gap-2"
                >
                  <X size={18} /> Cancel Order
                </Button>
              ) : order.status === 'delivered' ? (
                <Button
                  fullWidth
                  onClick={handleReorder}
                  className="flex items-center justify-center gap-2"
                >
                  <RotateCw size={18} /> Reorder
                </Button>
              ) : null}
              <Button
                fullWidth
                variant="outline"
                className="flex items-center justify-center gap-2"
              >
                <MessageSquare size={18} /> Contact Support
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
