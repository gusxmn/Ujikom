'use client';

import { useParams } from 'next/navigation';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import CouponForm from '../../../CouponForm';

export default function EditCouponPage() {
  const params = useParams();
  const couponId = parseInt(params.id as string);

  return (
    <AdminLayout>
      <CouponForm couponId={couponId} mode="edit" />
    </AdminLayout>
  );
}
