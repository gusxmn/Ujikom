'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import AdminDashboard from './Dashboard';

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="ADMIN">
      <AdminLayout>
        <AdminDashboard />
      </AdminLayout>
    </ProtectedRoute>
  );
}
