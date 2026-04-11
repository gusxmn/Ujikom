'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import ProtectedRoute from '@/lib/components/ProtectedRoute';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Textarea } from '@/lib/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { PaymentCheckout } from '@/lib/components/PaymentCheckout';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Lock,
  FileText,
} from 'lucide-react';

type CheckoutStep = 'address' | 'shipping' | 'payment';

const PAYMENT_METHODS_CONFIG = {
  BANK_TRANSFER: {
    label: '💳 Transfer Bank',
    subMethods: ['BCA', 'Mandiri', 'BNI', 'BTN', 'CIMB', 'Permata'],
    description: 'Transfer langsung ke rekening bank kami',
  },
  E_WALLET: {
    label: '📱 E-Wallet',
    subMethods: ['OVO', 'Dana', 'GoPay', 'Linkaja', 'QRIS'],
    description: 'Pembayaran via mobile wallet',
  },
  CREDIT_CARD: {
    label: '💳 Kartu Kredit',
    subMethods: ['Visa', 'Mastercard', 'AmEx'],
    description: 'Pembayaran dengan kartu kredit',
  },
  VIRTUAL_ACCOUNT: {
    label: '🏧 Virtual Account',
    subMethods: ['BCA VA', 'BRI VA', 'Mandiri VA'],
    description: 'Transfer ke virtual account',
  },
};

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [selectedPaymentSubMethod, setSelectedPaymentSubMethod] = useState<string | null>(null);
  const [orderNotes, setOrderNotes] = useState('');
  const [cartData, setCartData] = useState<any>(null);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [orderCreating, setOrderCreating] = useState(false);

  // Fetch cart from API
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const response = await api.get('/cart');
        setCartData(response.data?.items || []);
        
        // Get coupon code from sessionStorage (temporary storage during checkout flow)
        const savedCoupon = sessionStorage.getItem('couponCode');
        if (savedCoupon) {
          setCouponCode(savedCoupon);
        }

        // Get previous payment method from sessionStorage
        const savedPaymentMethod = sessionStorage.getItem('lastPaymentMethod');
        if (savedPaymentMethod) {
          setSelectedPaymentMethod(savedPaymentMethod);
        }

        const savedPaymentSubMethod = sessionStorage.getItem('lastPaymentSubMethod');
        if (savedPaymentSubMethod) {
          setSelectedPaymentSubMethod(savedPaymentSubMethod);
        }

        const savedShippingMethod = sessionStorage.getItem('lastShippingMethod');
        if (savedShippingMethod) {
          setSelectedShipping(savedShippingMethod);
        }
      } catch (error) {
        console.error('Failed to fetch cart:', error);
        setCartData([]);
      }
    };
    if (user) {
      fetchCart();
    }
  }, [user]);

  // Fetch user addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['shipping-addresses'],
    queryFn: async () => {
      try {
        const response = await api.get('/shipping-addresses');
        return response.data || [];
      } catch (error: any) {
        console.error('Error fetching addresses:', error.response?.status, error.response?.data);
        throw error;
      }
    },
    enabled: !!user,
    retry: 1,
  });

  // Hardcoded shipping methods that match database
  const AVAILABLE_SHIPPING_METHODS = [
    { id: 1, name: 'Standard Shipping', description: 'Pengiriman standar 3-5 hari kerja', cost: 25000, estimatedDays: 5, isActive: true },
    { id: 2, name: 'Express Shipping', description: 'Pengiriman ekspres 1-2 hari kerja', cost: 50000, estimatedDays: 2, isActive: true },
    { id: 3, name: 'Same Day Delivery', description: 'Pengiriman hari yang sama', cost: 100000, estimatedDays: 1, isActive: true },
    { id: 4, name: 'Free Shipping', description: 'Gratis ongkos kirim untuk pembelian minimal Rp 1.000.000', cost: 0, estimatedDays: 7, isActive: true }
  ];

  // Fetch real shipping methods from API immediately
  const { data: apiShippingMethods = null } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      try {
        console.log('📦 Fetching shipping methods from API...');
        const response = await api.get('/shipping/methods');
        
        console.log('📦 Full API response:', {
          status: response.status,
          dataLength: Array.isArray(response.data) ? response.data.length : 'not array'
        });
        
        // Backend returns array directly
        const methods = Array.isArray(response.data) ? response.data : [];
        console.log('✅ API Shipping methods:', methods.length, 'items');
        
        return methods.length > 0 ? methods : null;
      } catch (error: any) {
        console.error('❌ Error fetching shipping methods:', error.message);
        return null;
      }
    },
    retry: 1,
  });

  // Use API methods if available, otherwise use hardcoded
  const shippingMethods = apiShippingMethods || AVAILABLE_SHIPPING_METHODS;

  console.log('🚚 Using shipping methods:', {
    source: apiShippingMethods ? 'API' : 'Fallback',
    count: shippingMethods.length,
    methods: shippingMethods.map((m: any) => ({ id: m.id, name: m.name }))
  });

  // Auto-select first shipping method when they load
  useEffect(() => {
    console.log('useEffect: shipping methods changed', {
      count: shippingMethods.length,
      selectedShipping: selectedShipping || 'empty',
      firstMethod: shippingMethods[0]?.id
    });
    
    if (shippingMethods.length > 0 && !selectedShipping) {
      const firstMethodId = shippingMethods[0].id;
      console.log('🚚 Auto-selecting first shipping method:', {
        id: firstMethodId,
        name: shippingMethods[0].name,
        idType: typeof firstMethodId
      });
      setSelectedShipping(firstMethodId.toString());
    }
  }, [shippingMethods, selectedShipping]);

  // Get cost from selected shipping method
  const getShippingCost = () => {
    if (shippingMethods.length > 0 && selectedShipping) {
      const method = shippingMethods.find((m: any) => m.id?.toString() === selectedShipping);
      if (method) {
        console.log('💰 Shipping cost:', method.cost);
        return method.cost || 0;
      }
    }
    return 0;
  };

  const shippingCost = getShippingCost();
  const subtotal = cartData?.reduce((sum: number, item: any) => sum + (item.product?.price * item.quantity || 0), 0) || 0;
  // Backend will calculate discount, so just show subtotal + shipping for now
  const total = subtotal + shippingCost;

  const handleNextStep = () => {
    if (currentStep === 'address' && !selectedAddressId) {
      toast.error('Please select a shipping address');
      return;
    }
    if (currentStep === 'address') setCurrentStep('shipping');
    else if (currentStep === 'shipping') setCurrentStep('payment');
  };

  const handlePrevStep = () => {
    if (currentStep === 'shipping') setCurrentStep('address');
    else if (currentStep === 'payment') setCurrentStep('shipping');
  };

  const handlePlaceOrder = async () => {
    try {
      if (!selectedAddressId) {
        toast.error('Please select a shipping address');
        return;
      }

      if (!selectedShipping) {
        toast.error('Please select a shipping method');
        return;
      }

      if (!selectedPaymentMethod) {
        toast.error('Please select a payment method');
        return;
      }

      if (!selectedPaymentSubMethod) {
        toast.error('Please select a payment sub-method');
        return;
      }

      setOrderCreating(true);

      // Validate address
      const selectedAddressObj = addresses?.find((a: any) => a.id === selectedAddressId);
      if (!selectedAddressObj) {
        toast.error('Invalid address selected');
        setOrderCreating(false);
        return;
      }

      // Ensure selected values are proper types
      const addressId = Number(selectedAddressId);
      if (!Number.isInteger(addressId) || addressId <= 0) {
        toast.error('Invalid address ID');
        setOrderCreating(false);
        return;
      }

      // Validate shipping method
      if (!selectedShipping) {
        toast.error('Please select a shipping method');
        setOrderCreating(false);
        return;
      }

      // Get shipping method ID - MUST use real or fallback methods
      if (!shippingMethods || shippingMethods.length === 0) {
        console.error('❌ CRITICAL: No shipping methods available!', {
          shippingMethods,
          selectedShipping
        });
        toast.error('Critical error: No shipping methods available. Please refresh the page.');
        setOrderCreating(false);
        return;
      }

      if (!selectedShipping) {
        console.error('❌ CRITICAL: No shipping method selected!', {
          shippingMethods: shippingMethods.map((m: any) => ({ id: m.id, name: m.name }))
        });
        toast.error('Please select a shipping method');
        setOrderCreating(false);
        return;
      }

      const method = shippingMethods.find((m: any) => m.id?.toString() === selectedShipping);
      if (!method) {
        console.error('❌ Selected shipping method not found:', {
          selectedShipping,
          available: shippingMethods.map((m: any) => m.id)
        });
        toast.error(`Invalid shipping method selected: ${selectedShipping}`);
        setOrderCreating(false);
        return;
      }

      const shippingMethodId = Number(method.id);
      if (!Number.isInteger(shippingMethodId) || shippingMethodId <= 0) {
        toast.error('Invalid shipping method ID: ' + shippingMethodId);
        setOrderCreating(false);
        return;
      }

      // Validate payment method
      if (!selectedPaymentMethod) {
        toast.error('Please select a payment method');
        setOrderCreating(false);
        return;
      }

      if (!selectedPaymentSubMethod) {
        toast.error('Please select a payment sub-method');
        setOrderCreating(false);
        return;
      }

      // Map payment method to backend format
      const paymentMethodMap: { [key: string]: string } = {
        'BANK_TRANSFER': 'bank_transfer',
        'E_WALLET': 'e_wallet',
        'CREDIT_CARD': 'credit_card',
        'VIRTUAL_ACCOUNT': 'virtual_account',
      };
      const paymentMethod = paymentMethodMap[selectedPaymentMethod] || 'bank_transfer';

      console.log('💳 Payment method selected:', selectedPaymentMethod);
      console.log('💳 Payment method mapped to:', paymentMethod);

      // Store payment method details for later payment processing
      sessionStorage.setItem('paymentMethod', selectedPaymentMethod || '');
      sessionStorage.setItem('paymentSubMethod', selectedPaymentSubMethod || '');
      sessionStorage.setItem('lastPaymentMethod', selectedPaymentMethod || '');
      sessionStorage.setItem('lastPaymentSubMethod', selectedPaymentSubMethod || '');
      sessionStorage.setItem('lastShippingMethod', selectedShipping || '');

      // Build order data with correct types for backend
      const orderData = {
        addressId: addressId,
        shippingMethodId: shippingMethodId,
        paymentMethod: paymentMethod,
        notes: orderNotes || '',
        ...(couponCode && { couponCode }),
      };

      console.log('📦 Sending order data:', orderData);
      console.log('Data types:', {
        addressId: typeof orderData.addressId,
        shippingMethodId: typeof orderData.shippingMethodId,
        paymentMethod: typeof orderData.paymentMethod,
      });
      console.log('Using endpoint: POST /orders');

      const response = await api.post('/orders', orderData);

      // Clear coupon code from sessionStorage
      sessionStorage.removeItem('couponCode');

      toast.success('✅ Pesanan berhasil dibuat! Membuat invoice...');
      
      // Redirect to success page with order ID
      router.push(`/checkout/success?orderId=${response.data?.order?.id || response.data?.id}`);
    } catch (error: any) {
      console.error('❌ Full error object:', error);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to place order';
      
      // Better error message extraction
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error.response?.status === 401) {
        errorMessage = 'Unauthorized - please login again';
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid order data - please check your selections';
      } else if (error.response?.status === 0) {
        errorMessage = 'Network error - backend may be down or CORS issue';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      console.error('Final error message to show:', errorMessage);
      toast.error(errorMessage);
    } finally {
      setOrderCreating(false);
    }
  };

  const steps = [
    { id: 'address', label: 'Shipping Address', icon: MapPin },
    { id: 'shipping', label: 'Shipping Method', icon: Truck },
    { id: 'payment', label: 'Payment Method', icon: CreditCard },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = 
                (step.id === 'address' && currentStep !== 'address') ||
                (step.id === 'shipping' && currentStep === 'payment') ||
                (step.id === 'payment' && currentStep === 'payment');
              const isActive = step.id === currentStep;

              return (
                <div key={step.id} className="flex-1">
                  <div className="flex items-center">
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full font-semibold ${
                        isCompleted
                          ? 'bg-green-500 text-white'
                          : isActive
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {isCompleted ? <CheckCircle size={24} /> : <StepIcon size={24} />}
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                        {step.label}
                      </p>
                    </div>
                    {index < steps.length - 1 && (
                      <div
                        className={`flex-1 h-1 mx-4 ${
                          isCompleted ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 'address' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <MapPin size={24} />
                        Select Shipping Address
                      </CardTitle>
                      <Link href="/profile/addresses">
                        <Button variant="outline" size="sm">+ Add New Address</Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {addresses && addresses.length > 0 ? (
                      <div className="space-y-3">
                        {addresses.map((address: any) => (
                          <div key={address.id} className="border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                            <label className="flex items-start p-4 cursor-pointer">
                              <input
                                type="radio"
                                checked={selectedAddressId === address.id}
                                onChange={() => setSelectedAddressId(address.id)}
                                className="mt-1 mr-3"
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-black">{address.label}</p>
                                <p className="text-sm text-black font-medium">Penerima: {address.recipient}</p>
                                <p className="text-sm text-black">{address.address}</p>
                                <p className="text-sm text-black">{address.city}, {address.province} {address.postalCode}</p>
                                <p className="text-sm text-black">📱 {address.phone}</p>
                              </div>
                            </label>
                            <div className="px-4 pb-3 flex gap-2 border-t">
                              <Link href={`/profile/addresses?edit=${address.id}&redirect=/checkout`}>
                                <Button variant="outline" size="sm">Edit</Button>
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600 mb-4">No addresses saved yet</p>
                        <Link href="/profile/addresses">
                          <Button className="mx-auto">Add New Address</Button>
                        </Link>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Next Steps Guide */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-900 flex items-center gap-2">
                      📋 Langkah-Langkah Pembayaran
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-blue-900">
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                      <div>
                        <p className="font-semibold">Pilih alamat pengiriman</p>
                        <p className="text-xs">Pastikan alamat sudah benar</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                      <div>
                        <p className="font-semibold">Pilih metode pengiriman</p>
                        <p className="text-xs">Tentukan kecepatan pengiriman Anda</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                      <div>
                        <p className="font-semibold">Pilih metode pembayaran</p>
                        <p className="text-xs">Transfer bank, e-wallet, atau kartu kredit</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</div>
                      <div>
                        <p className="font-semibold">Klik "Place Order"</p>
                        <p className="text-xs">Invoice akan dibuat dan pembayaran diproses</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck size={24} />
                    Select Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shippingMethods && shippingMethods.length > 0 ? (
                    shippingMethods.map((method: any) => (
                      <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          checked={selectedShipping === method.id?.toString()}
                          onChange={() => {
                            console.log('📦 Selected shipping method:', method.id, method.name);
                            setSelectedShipping(method.id?.toString() || method.id);
                          }}
                          className="mr-3"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{method.name}</p>
                          <p className="text-sm text-gray-600">
                            Estimated delivery: {method.estimatedDays || method.days || '3-5'} business days
                          </p>
                        </div>
                        <p className="font-semibold text-blue-600">
                          {formatPrice(method.cost || method.price || 0)}
                        </p>
                      </label>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <p>Loading shipping methods...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment Method */}
            {currentStep === 'payment' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CreditCard size={24} />
                      Select Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {Object.entries(PAYMENT_METHODS_CONFIG).map(([key, method]: [string, any]) => (
                      <div key={key} className="border border-gray-200 rounded-lg hover:bg-gray-50 transition">
                        <label className="flex items-start p-4 cursor-pointer">
                          <input
                            type="radio"
                            checked={selectedPaymentMethod === key}
                            onChange={() => {
                              setSelectedPaymentMethod(key);
                              setSelectedPaymentSubMethod(null); // Reset sub-method
                            }}
                            className="mt-1 mr-3"
                          />
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{method.label}</p>
                            <p className="text-sm text-gray-600">{method.description}</p>
                          </div>
                        </label>
                        
                        {/* Sub-methods (show when selected) */}
                        {selectedPaymentMethod === key && (
                          <div className="px-4 pb-4 space-y-2 border-t">
                            <p className="text-sm font-medium text-gray-700 mt-3">Pilih bank/metode:</p>
                            <div className="grid grid-cols-2 gap-2">
                              {method.subMethods.map((subMethod: string) => (
                                <button
                                  key={subMethod}
                                  onClick={() => setSelectedPaymentSubMethod(subMethod)}
                                  className={`p-2 rounded text-sm font-medium transition ${
                                    selectedPaymentSubMethod === subMethod
                                      ? 'bg-blue-600 text-white'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {subMethod}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Order Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      placeholder="Add any special instructions for your order..."
                      value={orderNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOrderNotes(e.target.value)}
                      rows={4}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep !== 'address' && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={handlePrevStep}
                >
                  <ArrowLeft size={18} /> Back
                </Button>
              )}
              {currentStep !== 'payment' && (
                <Button className="flex items-center gap-2 ml-auto" onClick={handleNextStep}>
                  Next <ArrowRight size={18} />
                </Button>
              )}
              {currentStep === 'payment' && (
                <Button
                  className="ml-auto bg-green-600 hover:bg-green-700 flex items-center gap-2"
                  onClick={handlePlaceOrder}
                  disabled={orderCreating || !selectedPaymentMethod || !selectedPaymentSubMethod}
                >
                  {orderCreating ? <>Creating order...</> : <><CheckCircle size={18} /> Place Order</>}
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3 pb-4 border-b">
                  {cartData && cartData.length > 0 ? (
                    cartData.map((item: any, index: number) => (
                      <div key={index} className="flex justify-between text-sm">
                        <div>
                          <p className="font-medium text-black">{item.product?.name || `Product #${item.productId}`}</p>
                          <p className="text-black">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-black">{formatPrice((item.product?.price || item.price) * item.quantity)}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-black">No items in cart</p>
                  )}
                </div>

                {/* Pricing */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-black">Subtotal</span>
                    <span className="font-medium text-black">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-black">Shipping</span>
                    <span className="font-medium text-black">{formatPrice(shippingCost)}</span>
                  </div>
                  {couponCode && (
                    <div className="flex justify-between text-green-600 bg-green-50 p-2 rounded text-xs">
                      <span className="font-medium">Kupon: {couponCode}</span>
                      <span className="font-semibold">(Applied at checkout)</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t text-base font-semibold">
                    <span className="text-black">Total Estimate</span>
                    <span className="text-blue-600">{formatPrice(total)}</span>
                  </div>
                  {couponCode && (
                    <div className="text-xs text-gray-500 pt-2 italic">
                      * Discount akan dihitung saat checkout selesai
                    </div>
                  )}
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-2 text-xs text-black pt-4 border-t">
                  <Lock size={14} /> Secure checkout with SSL encryption
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </ProtectedRoute>
  );
}
