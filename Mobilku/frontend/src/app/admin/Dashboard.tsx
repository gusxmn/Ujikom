'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { 
  BarChart3,
  ShoppingBag,
  Users,
  DollarSign,
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  RefreshCw,
  Download,
  Calendar,
  ArrowRight,
  MoreVertical
} from 'lucide-react';
import { formatPrice, formatNumber, formatDate } from '@/lib/utils';
import { CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [timeRange, setTimeRange] = useState('week');
  const [chartType, setChartType] = useState('sales');

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      toast.error('Unauthorized access');
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['admin-stats', timeRange],
    queryFn: async () => {
      const response = await api.get(`/admin/dashboard?range=${timeRange}`);
      return response.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  // Fetch recent activities
  const { data: activities } = useQuery({
    queryKey: ['admin-activities'],
    queryFn: async () => {
      const response = await api.get('/admin/activities');
      return response.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  // Fetch low stock products
  const { data: lowStockProducts } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const response = await api.get('/admin/products/low-stock');
      return response.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  // Fetch recent orders
  const { data: recentOrders } = useQuery({
    queryKey: ['admin-recent-orders'],
    queryFn: async () => {
      const response = await api.get('/admin/orders/recent');
      return response.data;
    },
    enabled: !!user && user.role === 'ADMIN',
  });

  const handleExportData = () => {
    toast.success('Exporting dashboard data...');
    // Implement export logic here
  };

  const handleRefresh = () => {
    refetch();
    toast.success('Dashboard refreshed');
  };

  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="h-80 bg-gray-200 rounded"></div>
              <div className="h-80 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  const salesData = stats?.salesData || [];
  const customerData = stats?.customerData || [];

  const chartColors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];
  const barColors = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, Admin {user.name}!</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleExportData}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            
            <div className="flex items-center gap-2 bg-white border rounded-lg p-1">
              {['day', 'week', 'month', 'year'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Total Revenue */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatPrice(stats?.totalRevenue || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats?.revenueGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats?.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats?.revenueGrowth >= 0 ? '+' : ''}{stats?.revenueGrowth || 0}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Orders */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatNumber(stats?.totalOrders || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats?.orderGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats?.orderGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats?.orderGrowth >= 0 ? '+' : ''}{stats?.orderGrowth || 0}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingBag className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Customers */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Customers</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatNumber(stats?.totalCustomers || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats?.customerGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats?.customerGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats?.customerGrowth >= 0 ? '+' : ''}{stats?.customerGrowth || 0}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Average Order Value */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg. Order Value</p>
                  <p className="text-2xl font-bold mt-1">
                    {formatPrice(stats?.averageOrderValue || 0)}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {stats?.aovGrowth >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                    <span className={`text-sm font-medium ${
                      stats?.aovGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stats?.aovGrowth >= 0 ? '+' : ''}{stats?.aovGrowth || 0}%
                    </span>
                    <span className="text-sm text-gray-500 ml-1">vs last period</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Sales Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sales Overview</CardTitle>
                <div className="flex items-center gap-2">
                  {['sales', 'orders', 'customers'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setChartType(type)}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        chartType === type
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartType === 'sales' ? salesData : 
                          chartType === 'orders' ? stats?.orderData :
                          customerData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#666"
                      tickFormatter={(value: any) => {
                        if (timeRange === 'day') return value.slice(11, 16);
                        if (timeRange === 'week') return value.slice(5, 10);
                        return value.slice(0, 7);
                      }}
                    />
                    <YAxis stroke="#666" />
                    <Tooltip
                      formatter={(value: any) => [
                        chartType === 'sales' ? formatPrice(Number(value)) : value,
                        chartType.charAt(0).toUpperCase() + chartType.slice(1)
                      ]}
                      labelFormatter={(label: any) => `Date: ${label}`}
                    />
                    <Line
                      type="monotone"
                      dataKey={chartType === 'sales' ? 'amount' : 
                              chartType === 'orders' ? 'count' : 'customers'}
                      stroke="#4F46E5"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Category Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Category Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats?.categoryDistribution || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {stats?.categoryDistribution?.map((_: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatPrice(Number(value)), 'Revenue']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Section */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Orders</CardTitle>
                <Link href="/admin/orders">
                  <Button variant="ghost" size="sm" className="gap-1">
                    View All
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentOrders?.length > 0 ? (
                  recentOrders.map((order: any) => (
                    <div
                      key={order.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">#{order.orderNumber}</p>
                        <p className="text-sm text-gray-600">
                          {order.customer?.name || 'Guest'} • {formatDate(order.createdAt)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold">{formatPrice(Number(order.totalAmount))}</p>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            order.status === 'completed' ? 'bg-green-100 text-green-800' :
                            order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'pending' ? 'bg-blue-100 text-blue-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No recent orders</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Low Stock & Activities */}
          <div className="space-y-6">
            {/* Low Stock Products */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Low Stock Products</CardTitle>
                  <Link href="/admin/products">
                    <Button variant="ghost" size="sm" className="gap-1">
                      View All
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {lowStockProducts?.length > 0 ? (
                  <div className="space-y-3">
                    {lowStockProducts.slice(0, 5).map((product: any) => (
                      <div
                        key={product.id}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded overflow-hidden">
                            {product.images?.[0] && (
                              <img
                                src={product.images[0]}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            <p className="text-xs text-gray-600">SKU: {product.sku}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${
                            product.stock < 5 ? 'text-red-600' :
                            product.stock < 10 ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {product.stock} left
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mt-1 text-xs"
                            onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                          >
                            Restock
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600">All products are well-stocked</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Activities */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activities?.length > 0 ? (
                    activities.slice(0, 5).map((activity: any) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 p-2"
                      >
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {activity.type === 'order' && <ShoppingBag className="w-4 h-4 text-primary" />}
                          {activity.type === 'product' && <Package className="w-4 h-4 text-primary" />}
                          {activity.type === 'user' && <Users className="w-4 h-4 text-primary" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{activity.description}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDate(activity.createdAt)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No recent activities</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}