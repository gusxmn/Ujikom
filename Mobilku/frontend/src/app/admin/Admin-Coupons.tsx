'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/lib/components/ui/Dialog';
import {
  Ticket,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Plus,
  Loader2,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';

interface CouponData {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: number;
  minPurchase: number;
  maxDiscount?: number;
  usageLimit?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminCoupons() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<number | null>(null);
  const [coupons, setCoupons] = useState<CouponData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Fetch coupons
  const { refetch } = useQuery({
    queryKey: ['admin-coupons', searchTerm, filterActive],
    queryFn: async () => {
      try {
        setIsLoading(true);
        setCurrentPage(1);
        const response = await api.get('/coupons', {
          params: {
            page: 1,
            limit: 20, // Reduced from 100 to 20
            active: filterActive !== 'all' ? filterActive === 'active' : undefined,
          },
        });
        const data = response.data?.data || [];
        const meta = response.data?.meta;
        setCoupons(data);
        setTotalPages(meta?.totalPages || 0);
        setHasMore(1 < (meta?.totalPages || 0));
        return data;
      } catch (err) {
        console.error('Error fetching coupons:', err);
        setCoupons([]);
        setTotalPages(0);
        setHasMore(false);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
  });

  // Load more coupons
  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const response = await api.get('/coupons', {
        params: {
          page: nextPage,
          limit: 20,
          active: filterActive !== 'all' ? filterActive === 'active' : undefined,
        },
      });
      const newData = response.data?.data || [];
      const meta = response.data?.meta;
      setCoupons(prev => [...prev, ...newData]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < (meta?.totalPages || 0));
    } catch (error) {
      console.error('Error loading more coupons:', error);
      toast.error('Failed to load more coupons');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Delete coupon mutation
  const deleteCouponMutation = useMutation({
    mutationFn: async (couponId: number) => {
      await api.delete(`/coupons/${couponId}`);
    },
    onSuccess: () => {
      toast.success('Coupon deleted successfully');
      refetch();
      setDeleteDialogOpen(false);
      setCouponToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete coupon');
    },
  });

  const handleDeleteCoupon = (couponId: number) => {
    setCouponToDelete(couponId);
    setDeleteDialogOpen(true);
  };

  const filteredCoupons = (coupons || []).filter((coupon: CouponData) => {
    if (searchTerm && !coupon.code.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
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
        <Link href="/admin/coupons/new">
          <Button className="flex items-center gap-2 bg-black text-white hover:bg-gray-800">
            <Plus size={18} />
            Create Coupon
          </Button>
        </Link>
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
                        <p className="text-sm text-gray-600 mt-1">
                          Discount: {coupon.discountType === 'PERCENTAGE' ? `${coupon.value}%` : `IDR ${coupon.value.toLocaleString('id-ID')}`}
                        </p>
                        {coupon.usageLimit && (
                          <p className="text-sm text-gray-600 mt-1">
                            Usage Limit: {coupon.usageLimit}
                          </p>
                        )}
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
                    <Link href={`/admin/coupons/${coupon.id}/edit`}>
                      <button
                        className="p-2 rounded-lg hover:bg-blue-100 transition"
                        title="Edit coupon"
                      >
                        <Edit2 size={18} className="text-blue-600" />
                      </button>
                    </Link>
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
                  <span>Min Purchase: IDR {coupon.minPurchase?.toLocaleString('id-ID') || '0'}</span>
                  <span>Valid: {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}</span>
                  <span>Created: {formatDate(coupon.createdAt)}</span>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center py-6">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="gap-2"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more...
                  </>
                ) : (
                  `Load More (Page ${currentPage + 1} of ${totalPages})`
                )}
              </Button>
            </div>
          )}
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

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen}
        closeOnBackdropClick={!deleteCouponMutation.isPending}
        closeOnEscape={!deleteCouponMutation.isPending}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Coupon</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this coupon? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteCouponMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => couponToDelete && deleteCouponMutation.mutate(couponToDelete)}
              disabled={deleteCouponMutation.isPending}
            >
              {deleteCouponMutation.isPending ? 'Deleting...' : 'Delete Coupon'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
