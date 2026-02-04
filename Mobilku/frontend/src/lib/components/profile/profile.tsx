'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/components/ui/Tabs';
import { 
  User,
  ShoppingBag,
  Heart,
  MapPin,
  CreditCard,
  Settings,
  LogOut,
  Edit,
  Package,
  Truck,
  CheckCircle,
  Star,
  Clock,
  ChevronRight,
  Plus,
  Trash2
} from 'lucide-react';
import { formatDate, formatPrice } from '@/lib/utils';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProfilePage() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch user orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['user-orders'],
    queryFn: async () => {
      const response = await api.get('/orders');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch wishlist
  const { data: wishlist, isLoading: wishlistLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await api.get('/wishlist');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: async () => {
      const response = await api.get('/shipping-addresses');
      return response.data;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  if (!user) {
    router.push('/login');
    return null;
  }

  const recentOrders = orders?.slice(0, 5) || [];
  const defaultAddress = addresses?.find((addr: any) => addr.isDefault);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Account</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-5 h-5" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                {/* User Info */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-600">{user?.phone}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'overview'
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'orders'
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    My Orders
                  </button>
                  <button
                    onClick={() => setActiveTab('wishlist')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'wishlist'
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Heart className="w-5 h-5" />
                    Wishlist
                  </button>
                  <button
                    onClick={() => setActiveTab('addresses')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'addresses'
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <MapPin className="w-5 h-5" />
                    Addresses
                  </button>
                  <button
                    onClick={() => setActiveTab('payment')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === 'payment'
                        ? 'bg-primary text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    Payment Methods
                  </button>
                  <Link
                    href="/profile/settings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                    Settings
                  </Link>
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Orders</p>
                          <p className="text-2xl font-bold mt-1">{orders?.length || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Wishlist Items</p>
                          <p className="text-2xl font-bold mt-1">{wishlist?.length || 0}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                          <Heart className="w-6 h-6 text-red-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Member Since</p>
                          <p className="text-2xl font-bold mt-1">
                            {user?.createdAt && new Date(user.createdAt).getFullYear()}
                          </p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <Star className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Orders */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Recent Orders</CardTitle>
                      <Link href="/profile/orders">
                        <Button variant="ghost" size="sm" className="gap-1">
                          View All
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {recentOrders.length > 0 ? (
                      <div className="space-y-4">
                        {recentOrders.map((order: any) => (
                          <div
                            key={order.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div>
                              <p className="font-medium">Order #{order.orderNumber}</p>
                              <p className="text-sm text-gray-600">
                                {formatDate(order.createdAt)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">
                                {formatPrice(Number(order.totalAmount))}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <div className={`w-2 h-2 rounded-full ${
                                  order.status === 'delivered' ? 'bg-green-500' :
                                  order.status === 'shipped' ? 'bg-blue-500' :
                                  order.status === 'processing' ? 'bg-yellow-500' :
                                  'bg-gray-500'
                                }`} />
                                <span className="text-sm capitalize">
                                  {order.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No orders yet</p>
                        <Link href="/products" className="inline-block mt-4">
                          <Button variant="outline">Start Shopping</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Default Address */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Default Shipping Address</CardTitle>
                      <Link href="/profile/addresses">
                        <Button variant="ghost" size="sm" className="gap-2">
                          <Edit className="w-4 h-4" />
                          Manage
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {defaultAddress ? (
                      <div className="space-y-2">
                        <p className="font-medium">{defaultAddress.recipientName}</p>
                        <p className="text-gray-600">{defaultAddress.address}</p>
                        <p className="text-gray-600">
                          {defaultAddress.city}, {defaultAddress.province} {defaultAddress.postalCode}
                        </p>
                        <p className="text-gray-600">Phone: {defaultAddress.phone}</p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-3">No address saved</p>
                        <Link href="/profile/addresses/new">
                          <Button variant="outline" size="sm">
                            Add Address
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>My Orders</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {ordersLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-20 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : orders?.length > 0 ? (
                      <div className="space-y-4">
                        {orders.map((order: any) => (
                          <OrderCard key={order.id} order={order} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No orders yet</p>
                        <Link href="/products" className="inline-block mt-4">
                          <Button variant="outline">Start Shopping</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Wishlist Tab */}
            {activeTab === 'wishlist' && (
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>My Wishlist</CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.success('Clear all wishlist items')}
                      >
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {wishlistLoading ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="aspect-square bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : wishlist?.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {wishlist.map((item: any) => (
                          <WishlistItemCard key={item.id} item={item} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">Your wishlist is empty</p>
                        <Link href="/products" className="inline-block mt-4">
                          <Button variant="outline">Browse Products</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Shipping Addresses</CardTitle>
                      <Link href="/profile/addresses/new">
                        <Button variant="outline" size="sm" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Add New Address
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {addressesLoading ? (
                      <div className="space-y-4">
                        {[...Array(2)].map((_, i) => (
                          <div key={i} className="animate-pulse">
                            <div className="h-32 bg-gray-200 rounded"></div>
                          </div>
                        ))}
                      </div>
                    ) : addresses?.length > 0 ? (
                      <div className="grid md:grid-cols-2 gap-4">
                        {addresses.map((address: any) => (
                          <AddressCard key={address.id} address={address} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No addresses saved</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Payment Methods Tab */}
            {activeTab === 'payment' && (
              <div>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Payment Methods</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => toast.success('Add new payment method')}
                      >
                        <Plus className="w-4 h-4" />
                        Add New
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Credit Card */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <CreditCard className="w-6 h-6 text-gray-600" />
                            <div>
                              <p className="font-medium">Visa ending in 4242</p>
                              <p className="text-sm text-gray-600">Expires 12/25</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">Remove</Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-gray-600">Default payment method</span>
                        </div>
                      </div>

                      {/* E-Wallet */}
                      <div className="border rounded-lg p-4 opacity-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                              <span className="font-bold text-orange-600">GO</span>
                            </div>
                            <div>
                              <p className="font-medium">GoPay</p>
                              <p className="text-sm text-gray-600">Connected</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" disabled>Remove</Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper Components
function OrderCard({ order }: { order: any }) {
  return (
    <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-4 border-b bg-gray-50">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-medium">Order #{order.orderNumber}</p>
            <p className="text-sm text-gray-600">
              {formatDate(order.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="font-bold">{formatPrice(Number(order.totalAmount))}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${
                  order.status === 'delivered' ? 'bg-green-500' :
                  order.status === 'shipped' ? 'bg-blue-500' :
                  order.status === 'processing' ? 'bg-yellow-500' :
                  'bg-gray-500'
                }`} />
                <span className="text-sm capitalize">
                  {order.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            <Link href={`/orders/${order.id}`}>
              <Button variant="ghost" size="sm">
                Details
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-3 overflow-x-auto">
          {order.items.slice(0, 3).map((item: any) => (
            <div key={item.id} className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                {item.product.images?.[0] && (
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{item.product.name}</p>
                <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
              </div>
            </div>
          ))}
          {order.items.length > 3 && (
            <span className="text-sm text-gray-500">
              +{order.items.length - 3} more items
            </span>
          )}
        </div>
        {order.status === 'delivered' && (
          <Button variant="outline" size="sm" className="mt-3">
            Rate Products
          </Button>
        )}
      </div>
    </div>
  );
}

function WishlistItemCard({ item }: { item: any }) {
  const product = item.product || item;
  
  return (
    <div className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          {/* Product Image */}
          <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
            {product.images?.[0] ? (
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package className="w-12 h-12" />
              </div>
            )}
            <button className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-600 transition-colors">
              <Heart className="w-4 h-4 fill-current" />
            </button>
          </div>
          
          {/* Product Info */}
          <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mb-2">
            <span className="font-bold text-gray-900">
              {formatPrice(Number(product.price))}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(Number(product.originalPrice))}
              </span>
            )}
          </div>
          
          {/* Actions */}
          <div className="flex gap-2">
            <Link href={`/products/${product.slug}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                View
              </Button>
            </Link>
            <Button variant="primary" size="sm" className="flex-1">
              Add to Cart
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddressCard({ address }: { address: any }) {
  return (
    <Card className={`border-2 ${address.isDefault ? 'border-primary' : 'border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <p className="font-bold text-gray-900">{address.recipientName}</p>
            <p className="text-sm text-gray-600">{address.label}</p>
          </div>
          {address.isDefault && (
            <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
              Default
            </span>
          )}
        </div>
        
        <div className="space-y-1 text-sm text-gray-600 mb-4">
          <p>{address.address}</p>
          <p>{address.city}, {address.province}</p>
          <p>{address.postalCode}</p>
          <p>Phone: {address.phone}</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1">
            <Edit className="w-4 h-4 mr-2" />
            Edit
          </Button>
          {!address.isDefault && (
            <Button variant="ghost" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="w-4 h-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}