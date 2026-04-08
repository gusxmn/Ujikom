'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import AdminCoupons from '../Admin-Coupons';

export default function AdminCouponsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <AdminCoupons />
      </AdminLayout>
    </ProtectedRoute>
  );
}
