'use client';

import AdminLayout from '@/lib/components/layout/AdminLayout';
import ProductForm from '../../ProductForm';

export default function NewProductPage() {
  return (
    <AdminLayout>
      <ProductForm mode="create" />
    </AdminLayout>
  );
}
