'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import AdminOrders from '../Admin-orders';

export default function AdminOrdersPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <AdminOrders />
      </AdminLayout>
    </ProtectedRoute>
  );
}
