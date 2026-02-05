'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Textarea } from '@/lib/components/ui/Textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { RadioGroup, RadioGroupItem } from '@/lib/components/ui/RadioGroup';
import { Label } from '@/lib/components/ui/Label';
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Shield,
  Lock,
  Package,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';

type CheckoutStep = 'address' | 'shipping' | 'payment';

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<string>('');
  const [selectedPayment, setSelectedPayment] = useState<string>('');
  const [orderNotes, setOrderNotes] = useState('');

  // Fetch cart for checkout summary
  const { data: cart, isLoading: cartLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch shipping addresses
  const { data: addresses, isLoading: addressesLoading } = useQuery({
    queryKey: ['shipping-addresses'],
    queryFn: async () => {
      const response = await api.get('/shipping-addresses');
      return response.data;
    },
    enabled: !!user,
  });

  // Fetch available shipping methods
  const { data: shippingMethods } = useQuery({
    queryKey: ['shipping-methods'],
    queryFn: async () => {
      const response = await api.get('/shipping/methods');
      return response.data;
    },
    enabled: currentStep === 'shipping',
  });

  // Create order mutation
  const createOrderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      const response = await api.post('/orders', orderData);
      return response.data;
    },
    onSuccess: (data) => {
      toast.success('Order placed successfully!');
      router.push(`/orders/${data.order.id}/success`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to place order');
    },
  });

  // Add new address mutation
  const addAddressMutation = useMutation({
    mutationFn: async (addressData: any) => {
      const response = await api.post('/shipping-addresses', addressData);
      return response.data;
    },
    onSuccess: () => {
      toast.success('Address added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add address');
    },
  });

  const cartItems = cart?.items || [];
  const subtotal = cartItems.reduce((total: number, item: any) => 
    total + (Number(item.product.price) * item.quantity), 0);
  
  const selectedShippingMethod = shippingMethods?.find(
    (method: any) => method.id === selectedShipping
  );
  const shippingFee = selectedShippingMethod?.cost || 0;
  const total = subtotal + shippingFee;

  const steps = [
    { id: 'address', label: 'Shipping Address', icon: MapPin },
    { id: 'shipping', label: 'Shipping Method', icon: Truck },
    { id: 'payment', label: 'Payment', icon: CreditCard },
  ];

  const handleNextStep = () => {
    if (currentStep === 'address') {
      if (!selectedAddressId) {
        toast.error('Please select a shipping address');
        return;
      }
      setCurrentStep('shipping');
    } else if (currentStep === 'shipping') {
      if (!selectedShipping) {
        toast.error('Please select a shipping method');
        return;
      }
      setCurrentStep('payment');
    } else if (currentStep === 'payment') {
      handlePlaceOrder();
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 'shipping') {
      setCurrentStep('address');
    } else if (currentStep === 'payment') {
      setCurrentStep('shipping');
    }
  };

  const handlePlaceOrder = () => {
    if (!selectedPayment) {
      toast.error('Please select a payment method');
      return;
    }

    const orderData = {
      addressId: selectedAddressId,
      shippingMethodId: selectedShipping,
      paymentMethod: selectedPayment,
      notes: orderNotes,
    };

    createOrderMutation.mutate(orderData);
  };

  const handleAddNewAddress = () => {
    // In a real app, this would open a modal or navigate to address form
    const newAddress = {
      recipientName: 'New Address',
      phone: '+6281234567890',
      address: '123 Street, City, Province',
      city: 'Jakarta',
      province: 'DKI Jakarta',
      postalCode: '12345',
      isDefault: false,
    };

    addAddressMutation.mutate(newAddress);
  };

  const paymentMethods = [
    { id: 'credit_card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
    { id: 'gopay', name: 'GoPay', icon: '📱' },
    { id: 'ovo', name: 'OVO', icon: '📱' },
    { id: 'shopeepay', name: 'ShopeePay', icon: '🛍️' },
    { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
  ];

  if (!user) {
    router.push('/login?redirect=/checkout');
    return null;
  }

  if (cartLoading) {
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

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Your Cart is Empty</h2>
            <p className="text-gray-600 mb-6">
              Add some items to your cart before checkout
            </p>
            <Link href="/products">
              <Button variant="primary">Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Checkout</h1>
          <p className="text-gray-600 mt-2">
            Complete your purchase in 3 easy steps
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = steps.findIndex(s => s.id === currentStep) >= index;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted
                        ? 'bg-primary text-white'
                        : isCurrent
                        ? 'border-2 border-primary bg-white text-primary'
                        : 'border-2 border-gray-300 bg-white text-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <Icon className="w-6 h-6" />
                      )}
                    </div>
                    <span className={`text-sm font-medium ${
                      isCompleted || isCurrent ? 'text-primary' : 'text-gray-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`w-24 h-1 mx-4 ${
                      isCompleted ? 'bg-primary' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Checkout Steps */}
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Address */}
            {currentStep === 'address' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    Shipping Address
                  </CardTitle>
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
                    <div className="space-y-4">
                      <RadioGroup
                        value={selectedAddressId?.toString()}
                        onValueChange={(value: string) => setSelectedAddressId(parseInt(value))}
                      >
                        {addresses.map((address: any) => (
                          <div key={address.id} className="relative">
                            <RadioGroupItem
                              value={address.id.toString()}
                              id={`address-${address.id}`}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`address-${address.id}`}
                              className={`flex cursor-pointer border rounded-lg p-4 hover:border-primary transition-colors ${
                                selectedAddressId === address.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-1">
                                  {selectedAddressId === address.id && (
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between">
                                    <div>
                                      <p className="font-bold text-gray-900">
                                        {address.recipientName}
                                        {address.isDefault && (
                                          <span className="ml-2 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                                            Default
                                          </span>
                                        )}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        {address.phone}
                                      </p>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0"
                                        onClick={(e: React.MouseEvent) => {
                                          e.stopPropagation();
                                          // Handle edit address
                                        }}
                                      >
                                        <Edit className="w-4 h-4" />
                                      </Button>
                                      {!address.isDefault && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                          onClick={(e: React.MouseEvent) => {
                                            e.stopPropagation();
                                            // Handle delete address
                                          }}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="mt-3 text-gray-700">
                                    <p>{address.address}</p>
                                    <p>
                                      {address.city}, {address.province} {address.postalCode}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>

                      <div className="pt-4 border-t">
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={handleAddNewAddress}
                          disabled={addAddressMutation.isPending}
                        >
                          <Plus className="w-5 h-5" />
                          Add New Address
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No shipping addresses found</p>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={handleAddNewAddress}
                        disabled={addAddressMutation.isPending}
                      >
                        <Plus className="w-5 h-5" />
                        Add Your First Address
                      </Button>
                    </div>
                  )}

                  {/* Order Notes */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Notes (Optional)
                    </label>
                    <Textarea
                      placeholder="Add special instructions for your order..."
                      value={orderNotes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOrderNotes(e.target.value)}
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Shipping Method */}
            {currentStep === 'shipping' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-6 h-6" />
                    Shipping Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {shippingMethods?.length > 0 ? (
                    <RadioGroup
                      value={selectedShipping}
                      onValueChange={setSelectedShipping}
                    >
                      <div className="space-y-4">
                        {shippingMethods.map((method: any) => (
                          <div key={method.id} className="relative">
                            <RadioGroupItem
                              value={method.id}
                              id={`shipping-${method.id}`}
                              className="sr-only"
                            />
                            <Label
                              htmlFor={`shipping-${method.id}`}
                              className={`flex cursor-pointer border rounded-lg p-4 hover:border-primary transition-colors ${
                                selectedShipping === method.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-gray-300'
                              }`}
                            >
                              <div className="flex items-start gap-3 flex-1">
                                <div className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 mt-1">
                                  {selectedShipping === method.id && (
                                    <div className="w-3 h-3 rounded-full bg-primary" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-bold text-gray-900">
                                        {method.name}
                                      </p>
                                      <p className="text-sm text-gray-600 mt-1">
                                        Estimated delivery: {method.estimatedDays} business days
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="font-bold text-gray-900">
                                        {method.cost === 0 ? 'FREE' : formatPrice(method.cost)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  {method.description && (
                                    <div className="mt-3 text-sm text-gray-600">
                                      {method.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Label>
                          </div>
                        ))}
                      </div>
                    </RadioGroup>
                  ) : (
                    <div className="text-center py-8">
                      <Truck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-600">No shipping methods available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Step 3: Payment Method */}
            {currentStep === 'payment' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-6 h-6" />
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedPayment}
                    onValueChange={setSelectedPayment}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {paymentMethods.map((method) => (
                        <div key={method.id} className="relative">
                          <RadioGroupItem
                            value={method.id}
                            id={`payment-${method.id}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`payment-${method.id}`}
                            className={`flex cursor-pointer border rounded-lg p-4 hover:border-primary transition-colors ${
                              selectedPayment === method.id
                                ? 'border-primary bg-primary/5'
                                : 'border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0">
                                {selectedPayment === method.id && (
                                  <div className="w-3 h-3 rounded-full bg-primary" />
                                )}
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-2xl">{method.icon}</span>
                                <div>
                                  <p className="font-bold text-gray-900">
                                    {method.name}
                                  </p>
                                  {method.id === 'cod' && (
                                    <p className="text-xs text-gray-500">
                                      Pay when your order arrives
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>

                  {/* Security Info */}
                  <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-3">
                      <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800">
                          Secure Payment
                        </p>
                        <p className="text-sm text-green-700 mt-1">
                          Your payment information is encrypted and secure. We never store your credit card details.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6">
              {currentStep !== 'address' && (
                <Button
                  variant="outline"
                  onClick={handlePrevStep}
                  className="gap-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Back
                </Button>
              )}
              
              <Button
                variant="primary"
                onClick={handleNextStep}
                className="gap-2 ml-auto"
                disabled={createOrderMutation.isPending}
              >
                {currentStep === 'payment' ? (
                  <>
                    {createOrderMutation.isPending ? 'Processing...' : 'Place Order'}
                    <Lock className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Continue to {currentStep === 'address' ? 'Shipping' : 'Payment'}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <Card>
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Items List */}
                  <div className="space-y-4 mb-6">
                    <h3 className="font-medium text-gray-900">Items ({cartItems.length})</h3>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                      {cartItems.map((item: any) => (
                        <div key={item.id} className="flex gap-3">
                          <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                            {item.product.images?.[0] ? (
                              <img
                                src={item.product.images[0]}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {item.product.name}
                            </p>
                            <p className="text-xs text-gray-600">
                              Qty: {item.quantity}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              {formatPrice(Number(item.product.price) * item.quantity)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3 border-t pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{formatPrice(subtotal)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-600">Shipping</span>
                      <span className="font-medium">
                        {selectedShippingMethod ? (
                          selectedShippingMethod.cost === 0 ? (
                            <span className="text-green-600">FREE</span>
                          ) : (
                            formatPrice(selectedShippingMethod.cost)
                          )
                        ) : (
                          <span className="text-gray-400">Select shipping</span>
                        )}
                      </span>
                    </div>

                    {selectedShippingMethod?.cost > 0 && subtotal < 1000000 && (
                      <div className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
                        <AlertCircle className="w-4 h-4 inline mr-1" />
                        Add {formatPrice(1000000 - subtotal)} more for free shipping
                      </div>
                    )}

                    <div className="border-t pt-4">
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Including taxes and shipping fees
                      </p>
                    </div>
                  </div>

                  {/* Security Badge */}
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                      <Lock className="w-4 h-4" />
                      <span>Secure SSL Encryption</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Return to Cart Link */}
              <div className="mt-4 text-center">
                <Link href="/cart">
                  <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                    Return to Cart
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}