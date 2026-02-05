'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/components/ui/Tabs';
import {
  Search,
  Filter,
  Download,
  Printer,
  Eye,
  ShoppingBag,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Star,
  ArrowRight
} from 'lucide-react';
import { formatPrice, formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');

  // Fetch orders
  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['user-orders', activeTab],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('status', activeTab);
      }
      const response = await api.get(`/orders?${params}`);
      return response.data;
    },
    enabled: !!user,
  });

  // Cancel order mutation
  const cancelOrderMutation = useMutation({
    mutationFn: (orderId: number) => api.post(`/orders/${orderId}/cancel`),
    onSuccess: () => {
      toast.success('Order cancelled successfully');
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    },
  });

  const handleCancelOrder = (orderId: number) => {
    if (confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      cancelOrderMutation.mutate(orderId);
    }
  };

  const handleReorder = (orderId: number) => {
    toast.success('Items added to cart from order #' + orderId);
    // Implement reorder logic
  };

  const handleDownloadInvoice = (orderId: number) => {
    toast.success('Downloading invoice...');
    // Implement invoice download
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="w-5 h-5" />;
      case 'cancelled':
        return <XCircle className="w-5 h-5" />;
      case 'shipped':
        return <Truck className="w-5 h-5" />;
      case 'processing':
        return <Package className="w-5 h-5" />;
      default:
        return <Clock className="w-5 h-5" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Payment';
      case 'processing':
        return 'Processing';
      case 'shipped':
        return 'Shipped';
      case 'delivered':
        return 'Delivered';
      case 'cancelled':
        return 'Cancelled';
      case 'refunded':
        return 'Refunded';
      default:
        return status;
    }
  };

  const filteredOrders = orders?.filter((order: any) => {
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        order.orderNumber.toLowerCase().includes(searchLower) ||
        order.customer?.name?.toLowerCase().includes(searchLower) ||
        order.items.some((item: any) => 
          item.product.name.toLowerCase().includes(searchLower)
        )
      );
    }
    return true;
  });

  if (!user) {
    router.push('/login');
    return null;
  }

  const statusCounts = {
    all: orders?.length || 0,
    pending: orders?.filter((o: any) => o.status === 'pending').length || 0,
    processing: orders?.filter((o: any) => o.status === 'processing').length || 0,
    shipped: orders?.filter((o: any) => o.status === 'shipped').length || 0,
    delivered: orders?.filter((o: any) => o.status === 'delivered').length || 0,
    cancelled: orders?.filter((o: any) => o.status === 'cancelled').length || 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
          <p className="text-gray-600 mt-2">
            Track and manage all your purchases
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
          {Object.entries(statusCounts).map(([status, count]) => (
            <Card
              key={status}
              className={`cursor-pointer transition-all hover:shadow-md ${
                activeTab === status ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setActiveTab(status)}
            >
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">
                  {count}
                </div>
                <div className="text-sm text-gray-600 capitalize mt-1">
                  {status === 'all' ? 'All Orders' : status}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search orders by order ID or product name..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => refetch()}
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredOrders?.length > 0 ? (
          <div className="space-y-6">
            {filteredOrders.map((order: any) => (
              <Card key={order.id} className="overflow-hidden">
                {/* Order Header */}
                <div className="border-b bg-gray-50">
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">
                              Order #{order.orderNumber}
                            </h3>
                            <p className="text-sm text-gray-600">
                              Placed on {formatDate(order.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatPrice(Number(order.totalAmount))}
                        </div>
                        <div className="flex items-center gap-2 mt-1 justify-end">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {order.items.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900">
                            {item.product.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            Quantity: {item.quantity} × {formatPrice(Number(item.product.price))}
                          </p>
                          {order.status === 'delivered' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 gap-1"
                            >
                              <Star className="w-4 h-4" />
                              Rate Product
                            </Button>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatPrice(Number(item.product.price) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {order.items.length > 3 && (
                      <div className="text-center text-gray-500">
                        + {order.items.length - 3} more item(s)
                      </div>
                    )}
                  </div>

                  {/* Order Actions */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" className="gap-2">
                        <Eye className="w-4 h-4" />
                        View Details
                      </Button>
                    </Link>
                    
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => handleDownloadInvoice(order.id)}
                    >
                      <Download className="w-4 h-4" />
                      Invoice
                    </Button>

                    {order.status === 'delivered' && (
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => handleReorder(order.id)}
                      >
                        <ShoppingBag className="w-4 h-4" />
                        Reorder
                      </Button>
                    )}

                    {['pending', 'processing'].includes(order.status) && (
                      <Button
                        variant="outline"
                        className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleCancelOrder(order.id)}
                        disabled={cancelOrderMutation.isPending}
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel Order
                      </Button>
                    )}

                    {order.status === 'shipped' && (
                      <Link href={`/orders/${order.id}/track`}>
                        <Button variant="outline" className="gap-2">
                          <Truck className="w-4 h-4" />
                          Track Order
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {activeTab === 'all' ? 'No Orders Yet' : `No ${activeTab} Orders`}
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'all'
                  ? "You haven't placed any orders yet. Start shopping to see your orders here."
                  : `You don't have any ${activeTab} orders at the moment.`}
              </p>
              <Link href="/products">
                <Button variant="primary" className="gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Start Shopping
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}