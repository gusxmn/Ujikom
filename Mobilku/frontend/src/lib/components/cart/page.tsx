'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent } from '@/lib/components/ui/Card';
import { 
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShoppingBag,
  Truck,
  CreditCard,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);

  // Fetch cart
  const { data: cart, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch shipping addresses
  const { data: addresses } = useQuery({
    queryKey: ['shipping-addresses'],
    queryFn: async () => {
      const response = await api.get('/shipping-addresses');
      return response.data;
    },
    enabled: !!user,
  });

  // Update cart item mutation
  const updateCartItemMutation = useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: number; quantity: number }) =>
      api.patch(`/cart/items/${itemId}`, { quantity }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update cart');
    },
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) =>
      api.delete(`/cart/items/${itemId}`),
    onSuccess: () => {
      toast.success('Item removed from cart');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
  });

  // Clear cart mutation
  const clearCartMutation = useMutation({
    mutationFn: () => api.delete('/cart/clear'),
    onSuccess: () => {
      toast.success('Cart cleared');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to clear cart');
    },
  });

  // Validate coupon mutation
  const validateCouponMutation = useMutation({
    mutationFn: (code: string) =>
      api.post('/coupons/validate', { 
        code, 
        totalAmount: cart?.items?.reduce((total: number, item: any) => 
          total + (Number(item.product.price) * item.quantity), 0) || 0 
      }),
    onSuccess: (response: any) => {
      setAppliedCoupon(response.data);
      toast.success('Coupon applied successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Invalid coupon');
    },
  });

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItemMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: number) => {
    if (confirm('Are you sure you want to remove this item from cart?')) {
      removeItemMutation.mutate(itemId);
    }
  };

  const handleApplyCoupon = () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }
    validateCouponMutation.mutate(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
  };

  const handleCheckout = () => {
    if (!cart?.items?.length) {
      toast.error('Your cart is empty');
      return;
    }
    
    if (!addresses?.length) {
      toast.error('Please add a shipping address first');
      router.push('/profile/addresses');
      return;
    }

    router.push('/checkout');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Please Login</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your cart
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1">
                <Button variant="primary" fullWidth>Login</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button variant="outline" fullWidth>Register</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded"></div>
                ))}
              </div>
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((total: number, item: any) => 
    total + (Number(item.product.price) * item.quantity), 0);
  
  const shippingFee = subtotal > 1000000 ? 0 : 50000; // Free shipping over 1M
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + shippingFee - discount;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-gray-600 mt-2">
            Review your items and proceed to checkout
          </p>
        </div>

        {cartItems.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-700 mb-3">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Add some items to get started!</p>
            <Link href="/products">
              <Button variant="primary" className="gap-2">
                <ShoppingBag className="w-5 h-5" />
                Browse Products
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Left Column - Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">
                      Items ({cartItems.length})
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm('Are you sure you want to clear your entire cart?')) {
                          clearCartMutation.mutate();
                        }
                      }}
                      disabled={clearCartMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear Cart
                    </Button>
                  </div>
                </div>

                <div className="divide-y">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                          {item.product.images?.[0] ? (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {item.product.name}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {item.product.category?.name || 'Uncategorized'}
                              </p>
                              {item.product.stock < item.quantity && (
                                <div className="flex items-center gap-1 text-amber-600 text-sm mt-1">
                                  <AlertCircle className="w-4 h-4" />
                                  <span>
                                    Only {item.product.stock} left in stock
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                {formatPrice(Number(item.product.price))}
                              </p>
                              {item.product.originalPrice && (
                                <p className="text-sm text-gray-500 line-through">
                                  {formatPrice(Number(item.product.originalPrice))}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center mt-4">
                            {/* Quantity Controls */}
                            <div className="flex items-center border rounded-lg">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 rounded-r-none"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1 || updateCartItemMutation.isPending}
                              >
                                <Minus className="w-4 h-4" />
                              </Button>
                              <span className="w-12 text-center font-medium">
                                {item.quantity}
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-10 w-10 rounded-l-none"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                                disabled={
                                  item.quantity >= item.product.stock ||
                                  updateCartItemMutation.isPending
                                }
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>

                            {/* Remove Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveItem(item.id)}
                              disabled={removeItemMutation.isPending}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Remove
                            </Button>
                          </div>

                          {/* Item Total */}
                          <div className="mt-4 pt-4 border-t">
                            <p className="text-lg font-semibold text-right">
                              {formatPrice(Number(item.product.price) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Order Summary Card */}
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-semibold mb-6">Order Summary</h2>

                    {/* Pricing Breakdown */}
                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span className="font-medium">{formatPrice(subtotal)}</span>
                      </div>

                      {/* Shipping */}
                      <div className="flex justify-between">
                        <span className="text-gray-600">Shipping</span>
                        <span className="font-medium">
                          {shippingFee === 0 ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            formatPrice(shippingFee)
                          )}
                        </span>
                      </div>
                      {subtotal < 1000000 && (
                        <p className="text-sm text-gray-500">
                          Add {formatPrice(1000000 - subtotal)} more for free shipping
                        </p>
                      )}

                      {/* Coupon Section */}
                      {!appliedCoupon ? (
                        <div className="pt-4 border-t">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Have a coupon?
                          </label>
                          <div className="flex gap-2">
                            <Input
                              type="text"
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCouponCode(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              variant="outline"
                              onClick={handleApplyCoupon}
                              disabled={validateCouponMutation.isPending || !couponCode.trim()}
                            >
                              {validateCouponMutation.isPending ? 'Applying...' : 'Apply'}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-4 border-t">
                          <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                              <Check className="w-5 h-5 text-green-600" />
                              <div>
                                <p className="font-medium text-green-800">
                                  {appliedCoupon.code} - {appliedCoupon.type === 'percentage' 
                                    ? `${appliedCoupon.value}% off` 
                                    : `${formatPrice(appliedCoupon.value)} off`}
                                </p>
                                {appliedCoupon.description && (
                                  <p className="text-sm text-green-600">
                                    {appliedCoupon.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleRemoveCoupon}
                              className="text-green-800 hover:text-green-900 hover:bg-green-100"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Discount */}
                      {discount > 0 && (
                        <div className="flex justify-between text-green-600">
                          <span>Discount</span>
                          <span className="font-medium">-{formatPrice(discount)}</span>
                        </div>
                      )}
                    </div>

                    {/* Total */}
                    <div className="border-t pt-4 mb-6">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Including taxes and shipping fees
                      </p>
                    </div>

                    {/* Checkout Button */}
                    <Button
                      variant="primary"
                      size="lg"
                      className="w-full gap-2"
                      onClick={handleCheckout}
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </CardContent>
                </Card>

                {/* Shipping Info */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Truck className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold">Shipping Info</h3>
                    </div>
                    {addresses?.length > 0 ? (
                      <div>
                        <p className="text-sm text-gray-600 mb-2">
                          Shipping to your default address:
                        </p>
                        <p className="font-medium">
                          {addresses.find((addr: any) => addr.isDefault)?.address || addresses[0].address}
                        </p>
                        <Link
                          href="/profile/addresses"
                          className="text-sm text-primary hover:underline mt-2 inline-block"
                        >
                          Change address
                        </Link>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-600 mb-3">
                          Add a shipping address to checkout
                        </p>
                        <Link href="/profile/addresses">
                          <Button variant="outline" size="sm" className="w-full">
                            Add Shipping Address
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Payment Methods */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <CreditCard className="w-5 h-5 text-gray-600" />
                      <h3 className="font-semibold">Payment Methods</h3>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-4 bg-blue-500 rounded"></div>
                        <span className="text-sm">Credit/Debit Card</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-4 bg-green-500 rounded"></div>
                        <span className="text-sm">Bank Transfer</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-4 bg-orange-500 rounded"></div>
                        <span className="text-sm">E-Wallet</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Continue Shopping */}
                <div className="text-center">
                  <Link href="/products">
                    <Button variant="outline" className="w-full">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}