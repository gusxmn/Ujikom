'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import ProductForm from '../../ProductForm';

export default function NewProductPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <ProductForm mode="create" />
      </AdminLayout>
    </ProtectedRoute>
  );
}
