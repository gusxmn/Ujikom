'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import CouponForm from '../../CouponForm';

export default function NewCouponPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <CouponForm mode="create" />
      </AdminLayout>
    </ProtectedRoute>
  );
}
