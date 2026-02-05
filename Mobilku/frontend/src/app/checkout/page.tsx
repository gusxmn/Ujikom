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
import {
  MapPin,
  Truck,
  CreditCard,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';

type CheckoutStep = 'address' | 'shipping' | 'payment';

const SHIPPING_METHODS = [
  { id: 'standard', name: 'Standard Shipping', price: 50000, days: '5-7' },
  { id: 'express', name: 'Express Shipping', price: 100000, days: '2-3' },
  { id: 'overnight', name: 'Overnight Shipping', price: 200000, days: '1' },
];

const PAYMENT_METHODS = [
  { id: 'credit_card', name: 'Credit Card', icon: '💳' },
  { id: 'bank_transfer', name: 'Bank Transfer', icon: '🏦' },
  { id: 'e_wallet', name: 'E-Wallet', icon: '📱' },
  { id: 'cod', name: 'Cash on Delivery', icon: '💵' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState<CheckoutStep>('address');
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [selectedPayment, setSelectedPayment] = useState('credit_card');
  const [orderNotes, setOrderNotes] = useState('');

  // Fetch cart
  const { data: cart } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      const response = await api.get('/cart');
      return response.data;
    },
  });

  // Fetch user addresses
  const { data: addresses } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: async () => {
      const response = await api.get('/users/addresses');
      return response.data || [];
    },
  });

  const shippingCost = SHIPPING_METHODS.find(m => m.id === selectedShipping)?.price || 0;
  const subtotal = cart?.items?.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0) || 0;
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
      const response = await api.post('/orders', {
        shippingAddressId: selectedAddressId,
        shippingMethod: selectedShipping,
        paymentMethod: selectedPayment,
        notes: orderNotes,
      });
      toast.success('Order placed successfully!');
      router.push(`/orders/${response.data.id}`);
    } catch (error) {
      toast.error('Failed to place order');
    }
  };

  const steps = [
    { id: 'address', label: 'Shipping Address', icon: MapPin },
    { id: 'shipping', label: 'Shipping Method', icon: Truck },
    { id: 'payment', label: 'Payment Method', icon: CreditCard },
  ];

  return (
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin size={24} />
                    Select Shipping Address
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {addresses && addresses.length > 0 ? (
                    <div className="space-y-3">
                      {addresses.map((address: any) => (
                        <label key={address.id} className="flex items-start p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                          <input
                            type="radio"
                            checked={selectedAddressId === address.id}
                            onChange={() => setSelectedAddressId(address.id)}
                            className="mt-1 mr-3"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">{address.recipientName}</p>
                            <p className="text-sm text-gray-600">{address.address}</p>
                            <p className="text-sm text-gray-600">{address.city}, {address.province} {address.postalCode}</p>
                            <p className="text-sm text-gray-600">{address.phone}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle size={32} className="mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-600 mb-4">No addresses saved yet</p>
                      <Button className="mx-auto">Add New Address</Button>
                    </div>
                  )}

                  <div className="mt-6 pt-6 border-t">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Plus size={18} /> Add New Address
                    </h3>
                    <div className="space-y-3">
                      <Input placeholder="Recipient Name" />
                      <Input placeholder="Phone Number" />
                      <Input placeholder="Address" />
                      <div className="grid grid-cols-2 gap-3">
                        <Input placeholder="City" />
                        <Input placeholder="Province" />
                      </div>
                      <Input placeholder="Postal Code" />
                      <Button fullWidth>Save Address</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
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
                  {SHIPPING_METHODS.map((method) => (
                    <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        checked={selectedShipping === method.id}
                        onChange={() => setSelectedShipping(method.id)}
                        className="mr-3"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">{method.name}</p>
                        <p className="text-sm text-gray-600">Estimated delivery: {method.days} business days</p>
                      </div>
                      <p className="font-semibold text-blue-600">{formatPrice(method.price)}</p>
                    </label>
                  ))}
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
                    {PAYMENT_METHODS.map((method) => (
                      <label key={method.id} className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="radio"
                          checked={selectedPayment === method.id}
                          onChange={() => setSelectedPayment(method.id)}
                          className="mr-3"
                        />
                        <span className="text-2xl mr-3">{method.icon}</span>
                        <p className="font-semibold text-gray-900">{method.name}</p>
                      </label>
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

                {selectedPayment === 'credit_card' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Lock size={20} /> Secure Payment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Input placeholder="Card Number" />
                      <div className="grid grid-cols-2 gap-4">
                        <Input placeholder="MM/YY" />
                        <Input placeholder="CVC" />
                      </div>
                      <Input placeholder="Cardholder Name" />
                    </CardContent>
                  </Card>
                )}
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
                >
                  <CheckCircle size={18} /> Place Order
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
                  {cart?.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Pricing */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">{formatPrice(shippingCost)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t text-base font-semibold">
                    <span>Total</span>
                    <span className="text-blue-600">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Security Badge */}
                <div className="flex items-center gap-2 text-xs text-gray-600 pt-4 border-t">
                  <Lock size={14} /> Secure checkout with SSL encryption
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
