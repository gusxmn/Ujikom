'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent } from '@/lib/components/ui/Card';
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
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

const STATUS_CONFIG: Record<string, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: 'yellow', label: 'Pending' },
  processing: { icon: Clock, color: 'blue', label: 'Processing' },
  shipped: { icon: Truck, color: 'purple', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'green', label: 'Delivered' },
  cancelled: { icon: X, color: 'red', label: 'Cancelled' },
};

export default function OrderHistoryPage() {
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [search, setSearch] = useState('');

  // Fetch orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ['user-orders', selectedStatus, search],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (search) params.append('search', search);
      const response = await api.get(`/orders?${params}`);
      return response.data || [];
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
    try {
      await api.post(`/orders/${orderId}/cancel`);
      toast.success('Order cancelled');
    } catch (error) {
      toast.error('Failed to cancel order');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <ShoppingBag size={32} /> Order History
          </h1>
          <p className="text-gray-600 mt-2">View and manage all your orders</p>
        </div>

        {/* Search and Filter */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <Input
                placeholder="Search by order ID or product name..."
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <select
            value={selectedStatus}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
          >
            {statusOptions.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {/* Orders List */}
        {orders && orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order: any) => {
              const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                      {/* Order Info */}
                      <div>
                        <p className="text-sm text-gray-600">Order ID</p>
                        <p className="font-semibold text-gray-900">#{order.id}</p>
                      </div>

                      {/* Date */}
                      <div>
                        <p className="text-sm text-gray-600">Order Date</p>
                        <p className="font-semibold text-gray-900">{formatDate(order.createdAt)}</p>
                      </div>

                      {/* Total */}
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="font-semibold text-blue-600">{formatPrice(order.total)}</p>
                      </div>

                      {/* Status */}
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusIcon
                            size={16}
                            className={`text-${statusConfig.color}-600`}
                          />
                          <span className={`font-semibold text-${statusConfig.color}-600`}>
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Items Preview */}
                    <div className="mb-4 pb-4 border-b">
                      <p className="text-sm font-medium text-gray-900 mb-2">Items</p>
                      <div className="space-y-1">
                        {order.items?.slice(0, 2).map((item: any, index: number) => (
                          <p key={index} className="text-sm text-gray-600">
                            {item.productName} × {item.quantity}
                          </p>
                        ))}
                        {order.items?.length > 2 && (
                          <p className="text-sm text-gray-600">
                            +{order.items.length - 2} more item{order.items.length - 2 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-wrap">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm" className="flex items-center gap-2">
                          <Eye size={16} /> View Details
                        </Button>
                      </Link>

                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => handleDownloadInvoice(order.id)}
                      >
                        <Download size={16} /> Invoice
                      </Button>

                      {['pending', 'processing'].includes(order.status) && (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleCancelOrder(order.id)}
                        >
                          <X size={16} /> Cancel
                        </Button>
                      )}

                      {order.status === 'delivered' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => handleReorder(order.id)}
                        >
                          <Repeat size={16} /> Reorder
                        </Button>
                      )}

                      {order.status === 'shipped' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Truck size={16} /> Track
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-4">No orders found</p>
              <p className="text-gray-500 mb-6">You haven't placed any orders yet</p>
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
