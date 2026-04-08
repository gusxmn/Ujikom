'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface CouponData {
  code: string;
  discountType: string;
  value: number;
  minPurchase?: number;
  maxDiscount?: number;
  startDate: string;
  endDate: string;
  usageLimit?: number;
}

interface CouponFormProps {
  couponId?: number;
  mode: 'create' | 'edit';
}

export default function CouponForm({ couponId, mode }: CouponFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CouponData>({
    code: '',
    discountType: 'PERCENTAGE',
    value: 0,
    minPurchase: 0,
    maxDiscount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 0,
  });

  // Fetch coupon data if editing
  useEffect(() => {
    if (mode === 'edit' && couponId) {
      const fetchCoupon = async () => {
        try {
          const response = await api.get(`/coupons/${couponId}`);
          const coupon = response.data;
          setFormData({
            code: coupon.code,
            discountType: coupon.discountType,
            value: coupon.value,
            minPurchase: coupon.minPurchase || 0,
            maxDiscount: coupon.maxDiscount || 0,
            startDate: coupon.startDate || '',
            endDate: coupon.endDate || '',
            usageLimit: coupon.usageLimit || 0,
          });
        } catch (error) {
          console.error('Failed to fetch coupon:', error);
          toast.error('Coupon not found');
          router.push('/admin/coupons');
        }
      };
      fetchCoupon();
    }
  }, [mode, couponId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    if (isNaN(formData.value) || formData.value <= 0) {
      toast.error('Discount value must be greater than 0');
      return;
    }

    if (formData.discountType === 'PERCENTAGE' && formData.value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (!formData.startDate) {
      toast.error('Start date is required');
      return;
    }

    if (!formData.endDate) {
      toast.error('End date is required');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType,
        value: parseFloat(formData.value.toString()),
        minPurchase: formData.minPurchase ? parseFloat(formData.minPurchase.toString()) : undefined,
        maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount.toString()) : undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit.toString()) : undefined,
      };

      if (mode === 'create') {
        await api.post('/coupons', submitData);
        toast.success('Coupon created successfully');
      } else {
        await api.patch(`/coupons/${couponId}`, submitData);
        toast.success('Coupon updated successfully');
      }
      router.push('/admin/coupons');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    let processedValue: any = value;

    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value);
    } else if (name === 'usageLimit' || name === 'minPurchase' || name === 'maxDiscount' || name === 'value') {
      processedValue = value === '' ? 0 : parseFloat(value);
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/coupons">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {mode === 'create' ? 'Add New Coupon' : 'Edit Coupon'}
          </h1>
          <p className="text-slate-600 mt-1">
            {mode === 'create'
              ? 'Create a new coupon for your store'
              : 'Update coupon information'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Coupon Code *
              </label>
              <Input
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="Enter coupon code (e.g., SUMMER2024)"
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Discount Information */}
        <Card>
          <CardHeader>
            <CardTitle>Discount Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Type *
                </label>
                <select
                  name="discountType"
                  value={formData.discountType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                  required
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED_AMOUNT">Fixed Amount (IDR)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Discount Value *
                </label>
                <Input
                  type="number"
                  name="value"
                  value={formData.value === 0 ? '' : formData.value.toString()}
                  onChange={handleInputChange}
                  placeholder={formData.discountType === 'PERCENTAGE' ? 'e.g., 10' : 'e.g., 50000'}
                  min="1"
                  step="0.01"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Min Purchase Amount (IDR)
                </label>
                <Input
                  type="number"
                  name="minPurchase"
                  value={formData.minPurchase === 0 ? '' : formData.minPurchase?.toString()}
                  onChange={handleInputChange}
                  placeholder="0 for no minimum"
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Max Discount Value (IDR)
                </label>
                <Input
                  type="number"
                  name="maxDiscount"
                  value={formData.maxDiscount === 0 ? '' : formData.maxDiscount?.toString()}
                  onChange={handleInputChange}
                  placeholder="Max discount cap (optional)"
                  min="0"
                  step="1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle>Valid Period</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Start Date *
                </label>
                <Input
                  type="datetime-local"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  End Date *
                </label>
                <Input
                  type="datetime-local"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Usage Limit
              </label>
              <Input
                type="number"
                name="usageLimit"
                value={formData.usageLimit === 0 ? '' : formData.usageLimit?.toString()}
                onChange={handleInputChange}
                placeholder="Leave empty for unlimited usage"
                min="1"
                step="1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/admin/coupons">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            {mode === 'create' ? 'Create Coupon' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
