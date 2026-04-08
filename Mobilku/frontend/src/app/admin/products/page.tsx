'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import AdminProducts from '../Admin-Products';

export default function AdminProductsPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <AdminProducts />
      </AdminLayout>
    </ProtectedRoute>
  );
}
