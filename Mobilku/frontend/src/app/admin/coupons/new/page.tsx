'use client';

import AdminLayout from '@/lib/components/layout/AdminLayout';
import CouponForm from '../../CouponForm';

export default function NewCouponPage() {
  return (
    <AdminLayout>
      <CouponForm mode="create" />
    </AdminLayout>
  );
}
