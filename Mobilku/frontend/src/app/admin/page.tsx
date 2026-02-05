'use client';

import AdminLayout from '@/lib/components/layout/AdminLayout';
import AdminDashboard from './Dashboard';

export default function AdminDashboardPage() {
  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  );
}
