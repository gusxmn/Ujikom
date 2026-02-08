'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import {
  Ticket,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CouponData {
  id: number;
  code: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  maxUses: number;
  usedCount: number;
  minPurchaseAmount: number;
  expiryDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCoupons() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingCoupon, setEditingCoupon] = useState<CouponData | null>(null);
  const [editForm, setEditForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED',
    discountValue: 0,
    maxUses: 0,
    minPurchaseAmount: 0,
    expiryDate: '',
  });
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch coupons
  const { data: coupons, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-coupons', searchTerm, filterActive],
    queryFn: async () => {
      try {
        const response = await api.get('/coupons', {
          params: {
            page: 1,
            limit: 100,
            active: filterActive !== 'all' ? filterActive === 'active' : undefined,
          },
        });
        console.log('Coupons response:', response.data);
        return response.data?.data || [];
      } catch (err) {
        console.error('Error fetching coupons:', err);
        throw err;
      }
    },
  });

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: number) => {
      await api.delete(`/coupons/${couponId}`);
    },
    onSuccess: () => {
      toast.success('Coupon deleted successfully');
      refetch();
    },
    onError: () => {
      toast.error('Failed to delete coupon');
    },
  });

  // Update coupon mutation
  const updateCouponMutation = useMutation({
    mutationFn: async ({
      couponId,
      data,
    }: {
      couponId: number;
      data: typeof editForm;
    }) => {
      await api.patch(`/coupons/${couponId}`, data);
    },
    onSuccess: () => {
      toast.success('Coupon updated successfully');
      setEditingCoupon(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update coupon');
    },
  });

  // Create coupon mutation
  const createCouponMutation = useMutation({
    mutationFn: async (data: typeof editForm) => {
      await api.post('/coupons', data);
    },
    onSuccess: () => {
      toast.success('Coupon created successfully');
      setShowCreateForm(false);
      setEditForm({
        code: '',
        description: '',
        discountType: 'PERCENTAGE',
        discountValue: 0,
        maxUses: 0,
        minPurchaseAmount: 0,
        expiryDate: '',
      });
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create coupon');
    },
  });

  const handleDeleteCoupon = (couponId: number) => {
    if (window.confirm('Are you sure you want to delete this coupon?')) {
      deleteCouponMutation.mutate(couponId);
    }
  };

  const handleEditCoupon = (coupon: CouponData) => {
    setEditingCoupon(coupon);
    setEditForm({
      code: coupon.code,
      description: coupon.description,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      maxUses: coupon.maxUses,
      minPurchaseAmount: coupon.minPurchaseAmount,
      expiryDate: coupon.expiryDate,
    });
  };

  const handleSaveEdit = () => {
    if (!editingCoupon) return;
    if (!editForm.code || !editForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    updateCouponMutation.mutate({
      couponId: editingCoupon.id,
      data: editForm,
    });
  };

  const handleCreateCoupon = () => {
    if (!editForm.code || !editForm.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    createCouponMutation.mutate(editForm);
  };

  const filteredCoupons = (coupons || []).filter((coupon: CouponData) => {
    if (searchTerm && !coupon.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-300 rounded w-1/4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-300 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        <p className="font-bold">Error loading coupons</p>
        <p className="text-sm">{error?.message || 'An error occurred'}</p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-black flex items-center gap-3">
            <Ticket size={32} className="text-black" />
            Coupons Management
          </h1>
          <p className="text-black mt-2">
            Total: {filteredCoupons.length} coupon{filteredCoupons.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-black text-white hover:bg-gray-800"
        >
          <Plus size={18} />
          Create Coupon
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              size={20}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by coupon code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black placeholder-gray-500"
            />
          </div>
        </div>
        <select
          value={filterActive}
          onChange={e => setFilterActive(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Coupons List */}
      {filteredCoupons.length > 0 ? (
        <div className="grid gap-4">
          {filteredCoupons.map((coupon: CouponData) => (
            <Card key={coupon.id} className="bg-white shadow-md">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Coupon Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <Ticket className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-black text-lg">{coupon.code}</h3>
                        <p className="text-sm text-gray-600">{coupon.description}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Discount: {coupon.discountType === 'PERCENTAGE' ? `${coupon.discountValue}%` : `$${coupon.discountValue}`} | Used: {coupon.usedCount}/{coupon.maxUses}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="flex items-center gap-3">
                    {/* Status Badge */}
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1 whitespace-nowrap ${
                      coupon.isActive
                        ? 'bg-green-600 text-white'
                        : 'bg-red-600 text-white'
                    }`}>
                      {coupon.isActive ? (
                        <>
                          <CheckCircle size={14} />
                          Active
                        </>
                      ) : (
                        <>
                          <XCircle size={14} />
                          Inactive
                        </>
                      )}
                    </span>

                    {/* Actions */}
                    <button
                      onClick={() => handleEditCoupon(coupon)}
                      className="p-2 rounded-lg hover:bg-blue-100 transition"
                      title="Edit coupon"
                    >
                      <Edit2 size={18} className="text-blue-600" />
                    </button>
                    <button
                      onClick={() => handleDeleteCoupon(coupon.id)}
                      className="p-2 rounded-lg hover:bg-red-100 transition"
                      title="Delete coupon"
                    >
                      <Trash2 size={18} className="text-red-600" />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500 flex justify-between flex-wrap gap-2">
                  <span>Min Purchase: ${coupon.minPurchaseAmount}</span>
                  <span>Expires: {formatDate(coupon.expiryDate)}</span>
                  <span>Created: {formatDate(coupon.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Ticket size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-black text-lg">No coupons found</p>
            <p className="text-gray-600 mt-2">Create your first coupon to get started</p>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {(editingCoupon || showCreateForm) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="text-black">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Code *
                </label>
                <input
                  type="text"
                  value={editForm.code}
                  onChange={e => setEditForm({ ...editForm, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Discount Type
                  </label>
                  <select
                    value={editForm.discountType}
                    onChange={e => setEditForm({ ...editForm, discountType: e.target.value as 'PERCENTAGE' | 'FIXED' })}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black bg-white"
                  >
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED">Fixed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-black mb-1">
                    Discount Value
                  </label>
                  <input
                    type="number"
                    value={editForm.discountValue}
                    onChange={e => setEditForm({ ...editForm, discountValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Max Uses
                </label>
                <input
                  type="number"
                  value={editForm.maxUses}
                  onChange={e => setEditForm({ ...editForm, maxUses: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Min Purchase Amount
                </label>
                <input
                  type="number"
                  value={editForm.minPurchaseAmount}
                  onChange={e => setEditForm({ ...editForm, minPurchaseAmount: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Expiry Date
                </label>
                <input
                  type="datetime-local"
                  value={editForm.expiryDate}
                  onChange={e => setEditForm({ ...editForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 border border-black rounded-lg focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={editingCoupon ? handleSaveEdit : handleCreateCoupon}
                  disabled={editingCoupon ? updateCouponMutation.isPending : createCouponMutation.isPending}
                  className="flex-1 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 transition"
                >
                  {editingCoupon
                    ? updateCouponMutation.isPending ? 'Saving...' : 'Save'
                    : createCouponMutation.isPending ? 'Creating...' : 'Create'}
                </button>
                <button
                  onClick={() => {
                    setEditingCoupon(null);
                    setShowCreateForm(false);
                    setEditForm({
                      code: '',
                      description: '',
                      discountType: 'PERCENTAGE',
                      discountValue: 0,
                      maxUses: 0,
                      minPurchaseAmount: 0,
                      expiryDate: '',
                    });
                  }}
                  className="flex-1 bg-gray-300 text-black px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
