'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent } from '@/lib/components/ui/Card';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, ShoppingBag, CreditCard, Check, X, AlertCircle } from 'lucide-react';
import { formatPrice, buildImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CartPage() {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; itemId: number | null }>({
    isOpen: false,
    itemId: null,
  });

  const { data: cart, isLoading, refetch: refetchCart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      console.log('🛒 Cart fetched:', response.data);
      return response.data;
    },
    enabled: !!user,
    staleTime: 0, // Always refetch
    refetchOnWindowFocus: true,
  });



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

  const validateCouponMutation = useMutation({
    mutationFn: (code: string) => {
      if (!cart?.items || cart.items.length === 0) {
        throw new Error('Keranjang belum ada produk');
      }
      
      const totalAmount = cart.items.reduce((total: number, item: any) => {
        const price = Number(item.product?.price) || Number(item.price) || 0;
        const qty = Number(item.quantity) || 0;
        const itemTotal = price * qty;
        console.log(`Item: price=${price}, qty=${qty}, total=${itemTotal}`);
        return total + itemTotal;
      }, 0);
      
      console.log('Final Total Amount:', totalAmount);
      console.log('Sending to backend:', { code, totalAmount });
      
      if (totalAmount <= 0) {
        throw new Error('Total harga tidak valid');
      }
      
      return api.post('/coupons/validate', { code, totalAmount });
    },
    onSuccess: (response: any) => {
      console.log('✅ Coupon Success Response:', response.data);
      setAppliedCoupon(response.data);
      
      // Save coupon code to sessionStorage (temp storage for checkout process)
      if (response.data?.code) {
        sessionStorage.setItem('couponCode', response.data.code);
        console.log('💾 Coupon code saved to sessionStorage');
      }
      
      toast.success('Kupon berhasil digunakan!');
    },
    onError: (error: any) => {
      console.error('❌ Coupon Error Details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      const errorMsg = error.response?.data?.message || error.message || 'Kode kupon tidak valid';
      toast.error(errorMsg);
    },
  });

  const handleUpdateQuantity = (itemId: number, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItemMutation.mutate({ itemId, quantity: newQuantity });
  };

  const handleRemoveItem = (itemId: number) => {
    setDeleteConfirmation({ isOpen: true, itemId });
  };

  const confirmDelete = () => {
    if (deleteConfirmation.itemId) {
      removeItemMutation.mutate(deleteConfirmation.itemId);
      setDeleteConfirmation({ isOpen: false, itemId: null });
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
    sessionStorage.removeItem('couponCode');
  };

  const handleCheckout = () => {
    if (!cart?.items?.length) {
      toast.error('Your cart is empty');
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
            <p className="text-gray-600 mb-6">Login to view your cart</p>
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
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 rounded"></div>)}
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
    total + (Number(item.product?.price || item.price || 0) * (item.quantity || 0)), 0);
  const shippingFee = subtotal > 1000000 ? 0 : 50000;
  const discount = appliedCoupon?.discount || 0;
  const total = subtotal + shippingFee - discount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Shopping Cart</h1>
              <p className="text-white">Review and manage your items</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-20 flex flex-col items-center">
            <ShoppingCart className="w-24 h-24 text-slate-300 mb-6" />
            <h2 className="text-3xl font-bold mb-3 text-black">Cart is empty</h2>
            <p className="text-black mb-12">Add items to get started</p>
            <Link href="/products">
              <Button className="gap-2 bg-blue-600 text-white">
                <ShoppingBag className="w-5 h-5" />
                Continue Shopping
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
                <div className="bg-blue-50 p-6 border-b border-slate-100 flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-black">Items ({cartItems.length})</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => clearCartMutation.isPending || confirm('Clear cart?') && clearCartMutation.mutate()}
                    disabled={clearCartMutation.isPending}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </div>

                <div className="divide-y">
                  {cartItems.map((item: any) => (
                    <div key={item.id} className="p-6 hover:bg-slate-50">
                      <div className="flex gap-4">
                        <div className="w-24 h-24 bg-slate-100 rounded-lg flex-shrink-0">
                          {(() => {
                            try {
                              let imageUrl = null;
                              const imageData = item.product.images;
                              if (typeof imageData === 'string') {
                                const parsed = JSON.parse(imageData);
                                imageUrl = Array.isArray(parsed) ? (parsed[0]?.url || parsed[0]) : null;
                              } else if (Array.isArray(imageData) && imageData.length > 0) {
                                imageUrl = typeof imageData[0] === 'string' ? imageData[0] : imageData[0]?.url;
                              }
                              imageUrl = buildImageUrl(imageUrl);
                              return imageUrl ? (
                                <img src={imageUrl} alt={item.product.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="text-gray-400" /></div>
                              );
                            } catch (e) {
                              return (
                                <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="text-gray-400" /></div>
                              );
                            }
                          })()}
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-lg text-black">{item.product.name}</h3>
                              <p className="text-sm text-black">{item.product.category?.name}</p>
                            </div>
                            <p className="text-xl font-bold text-blue-600">{formatPrice(Number(item.product.price))}</p>
                          </div>
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex items-center border rounded">
                              <Button size="sm" variant="ghost" onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}><Minus className="w-4 h-4" /></Button>
                              <span className="w-8 text-center text-black font-medium">{item.quantity}</span>
                              <Button size="sm" variant="ghost" onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} disabled={item.quantity >= item.product.stock}><Plus className="w-4 h-4" /></Button>
                            </div>
                            <Button size="sm" variant="ghost" onClick={() => handleRemoveItem(item.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                          <div className="mt-3 pt-3 border-t flex justify-between">
                            <span className="text-black font-medium">Total:</span>
                            <span className="font-bold text-blue-600">{formatPrice(Number(item.product.price) * item.quantity)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100">
                  <div className="bg-blue-50 p-6 border-b"><h2 className="text-xl font-bold text-black">Summary</h2></div>
                  <div className="p-6 space-y-3">
                    <div className="flex justify-between"><span className="text-black font-medium">Subtotal</span><span className="font-bold text-black">{formatPrice(subtotal)}</span></div>
                    <div className="flex justify-between pb-3 border-b"><span className="text-black font-medium">Shipping</span><span className="font-bold text-black">{shippingFee === 0 ? 'FREE' : formatPrice(shippingFee)}</span></div>
                    {!appliedCoupon ? (
                      <div className="pt-2 border-t">
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Coupon code" 
                            value={couponCode} 
                            onChange={(e) => setCouponCode(e.target.value)}
                            disabled={validateCouponMutation.isPending}
                          />
                          <Button 
                            variant="outline" 
                            onClick={handleApplyCoupon} 
                            disabled={!couponCode.trim() || validateCouponMutation.isPending}
                          >
                            {validateCouponMutation.isPending ? 'Loading...' : 'Apply'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t bg-green-50 p-2 rounded flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="font-semibold text-green-900">{appliedCoupon?.coupon?.code || appliedCoupon?.code || 'Kupon Digunakan'}</span>
                        </div>
                        <X className="w-4 h-4 cursor-pointer text-green-600" onClick={handleRemoveCoupon} />
                      </div>
                    )}
                    {discount > 0 && <div className="flex justify-between text-green-600 font-semibold pt-2"><span>Diskon</span><span>-{formatPrice(discount)}</span></div>}
                  </div>
                  <div className="border-t bg-blue-50 p-6">
                    <div className="flex justify-between mb-1"><span className="text-black font-medium">Total</span><span className="text-2xl font-bold text-blue-600">{formatPrice(total)}</span></div>
                  </div>
                  <div className="p-6 border-t">
                    <Button className="w-full bg-blue-600 text-white" onClick={handleCheckout}>Proceed <ArrowRight className="w-5 h-5 ml-2" /></Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="max-w-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-black">Confirm Delete</h3>
                </div>
              </div>
              <p className="text-gray-700 mb-6">Apakah Anda yakin ingin menghapus item ini dari keranjang?</p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setDeleteConfirmation({ isOpen: false, itemId: null })}
                >
                  Batal
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={confirmDelete}
                  disabled={removeItemMutation.isPending}
                >
                  {removeItemMutation.isPending ? 'Menghapus...' : 'Hapus'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}