'use client';

import { useParams } from 'next/navigation';
import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import CouponForm from '../../../CouponForm';

export default function EditCouponPage() {
  const params = useParams();
  const couponId = parseInt(params.id as string);

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <CouponForm couponId={couponId} mode="edit" />
      </AdminLayout>
    </ProtectedRoute>
  );
}
