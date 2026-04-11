'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import ProtectedRoute from '@/lib/components/ProtectedRoute';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent } from '@/lib/components/ui/Card';
import { PaymentStatusColumn } from '@/lib/components/PaymentStatusColumn';
import {
  Search,
  Download,
  Eye,
  Repeat,
  X,
  Truck,
  CheckCircle,
  Clock,
  ShoppingBag,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { 
  icon: any
  bgColor: string
  textColor: string
  borderColor: string
  hexColor: string
  label: string 
}> = {
  pending: { 
    icon: Clock, 
    bgColor: 'bg-yellow-50',
    textColor: 'text-yellow-700',
    borderColor: 'border-yellow-200',
    hexColor: '#ca8a04',
    label: 'Pending' 
  },
  processing: { 
    icon: Clock, 
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    hexColor: '#2563eb',
    label: 'Processing' 
  },
  shipped: { 
    icon: Truck, 
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    hexColor: '#7c3aed',
    label: 'Shipped' 
  },
  delivered: { 
    icon: CheckCircle, 
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    hexColor: '#16a34a',
    label: 'Delivered' 
  },
  cancelled: { 
    icon: X, 
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    hexColor: '#dc2626',
    label: 'Cancelled' 
  },
};

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Fetch orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['user-orders', selectedStatus, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (search) params.append('search', search);
      const response = await api.get(`/orders?${params}`);
      return response.data?.data || [];
    },
    enabled: !!user,
  });

  const statusOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await api.get(`/orders/${orderId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleReorder = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/reorder`);
      toast.success('Items added to cart');
    } catch (error) {
      toast.error('Failed to reorder');
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const confirmed = window.confirm(
      'Are you sure you want to cancel this order? This action cannot be undone.'
    );
    if (!confirmed) return;

    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
      refetch();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to cancel order';
      toast.error(errorMessage);
    }
  };

  const handleTrackPackage = (trackingNumber: string) => {
    if (trackingNumber) {
      router.push(`/track-package?tracking=${encodeURIComponent(trackingNumber)}`);
    } else {
      toast.error('Tracking number not available');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 rounded-full bg-gray-200">
                <ShoppingBag size={28} className="text-gray-900" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900">Order History</h1>
            </div>
            <p className="text-gray-600 ml-14">Track, manage, and reorder your purchases</p>
          </div>

          {/* Stats Cards */}
          {orders && orders.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
                  <p className="text-xs text-gray-600 mt-1">Total Orders</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter((o: any) => o.status === 'delivered').length}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Delivered</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter((o: any) => ['pending', 'processing'].includes(o.status)).length}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">In Progress</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4 text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {orders.filter((o: any) => o.status === 'shipped').length}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">Shipped</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Search and Filter */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <Input
                  placeholder="Search by order Number or product name..."
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div>
              <select
                value={selectedStatus}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium hover:border-gray-400 focus:ring-2 focus:ring-primary/20"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
          </div>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <div key={order.id} className="group">
                  <Card className="hover:shadow-lg transition-all duration-300 border-l-4" 
                    style={{borderLeftColor: statusConfig.hexColor}}>
                    <CardContent className="p-0">
                      {/* Top Bar with Status */}
                      <div className={`${statusConfig.bgColor} ${statusConfig.borderColor} border-b px-6 py-3 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${statusConfig.bgColor}`}>
                            <StatusIcon className={`w-5 h-5 ${statusConfig.textColor}`} />
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Order Number</p>
                            <p className={`text-lg font-bold ${statusConfig.textColor}`}>
                              #{order.orderNumber || order.id}
                            </p>
                          </div>
                        </div>
                        <div className={`px-3 py-1 rounded-full text-sm font-semibold ${statusConfig.bgColor} ${statusConfig.textColor} border ${statusConfig.borderColor}`}>
                          {statusConfig.label}
                        </div>
                      </div>

                      {/* Main Content */}
                      <div className="p-6">
                        {/* Row 1: Order Date, Total, Payment Status */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 pb-6 border-b">
                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Order Date</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {formatDate(order.createdAt)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Total Amount</p>
                            <p className="text-base font-bold text-primary mt-1">
                              {formatPrice(order.total)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Items</p>
                            <p className="text-base font-semibold text-gray-900 mt-1">
                              {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Payment</p>
                            <div className="mt-1">
                              <PaymentStatusColumn orderId={order.id} />
                            </div>
                          </div>
                        </div>

                        {/* Items List */}
                        <div className="mb-6">
                          <p className="text-sm font-bold text-gray-900 mb-3">Items Ordered</p>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {order.items?.slice(0, 5).map((item: any, index: number) => (
                              <div key={index} className="flex items-center justify-between text-sm p-2 rounded bg-gray-50">
                                <span className="text-gray-900"><span className="font-semibold">{item.quantity}×</span> {item.productName}</span>
                                <span className="font-semibold text-gray-900">{formatPrice(Number(item.price) * item.quantity)}</span>
                              </div>
                            ))}
                            {order.items?.length > 5 && (
                              <p className="text-sm text-gray-600 px-2 py-1">
                                +{order.items.length - 5} more item{order.items.length - 5 > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Shipping Info */}
                        {order.shippingAddress && (
                          <div className="mb-6 p-3 rounded-lg bg-blue-50 border border-blue-100">
                            <div className="flex gap-2">
                              <MapPin className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div className="text-sm text-blue-900">
                                <p className="font-semibold">Shipping to:</p>
                                <div className="text-xs mt-1 space-y-0.5">
                                  {typeof order.shippingAddress === 'object' ? (
                                    <>
                                      {order.shippingAddress.name && <p>{order.shippingAddress.name}</p>}
                                      {order.shippingAddress.street && <p>{order.shippingAddress.street}</p>}
                                      {order.shippingAddress.city && order.shippingAddress.province && (
                                        <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zipCode}</p>
                                      )}
                                      {order.shippingAddress.country && <p>{order.shippingAddress.country}</p>}
                                      {order.shippingAddress.phone && <p>Phone: {order.shippingAddress.phone}</p>}
                                    </>
                                  ) : (
                                    <p>{order.shippingAddress}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2 text-xs"
                            asChild
                          >
                            <Link href={`/orders/${order.id}`}>
                              <Eye size={14} /> View Details
                            </Link>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-xs"
                            onClick={() => handleDownloadInvoice(order.id)}
                          >
                            <Download size={14} /> Invoice
                          </Button>

                          {['pending', 'processing'].includes(order.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <X size={14} /> Cancel Order
                            </Button>
                          )}

                          {order.status === 'delivered' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-xs"
                              onClick={() => handleReorder(order.id)}
                            >
                              <Repeat size={14} /> Reorder
                            </Button>
                          )}

                          {order.status === 'shipped' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 text-xs text-purple-600 hover:bg-purple-50 border-purple-200"
                              onClick={() => handleTrackPackage(order.trackingNumber || order.id)}
                            >
                              <Truck size={14} /> Track Package
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="space-y-4">
                <div className="flex justify-center">
                  <ShoppingBag size={64} className="text-gray-300" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h3>
                  <p className="text-gray-600 mb-6">
                    You haven't placed any orders yet. Start shopping to see your orders here!
                  </p>
                </div>
                <Link href="/products">
                  <Button size="lg" className="gap-2">
                    <ShoppingBag size={18} /> Start Shopping
                    <ArrowRight size={18} />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
