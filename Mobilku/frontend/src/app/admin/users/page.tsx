'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import AdminUsers from '../Admin-Users';

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <AdminUsers />
      </AdminLayout>
    </ProtectedRoute>
  );
}
