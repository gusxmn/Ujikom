'use client';

import { use } from 'react';
import AdminLayout from '@/lib/components/layout/AdminLayout';
import ProductForm from '../../../ProductForm';

interface EditProductPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function EditProductPage({ params }: EditProductPageProps) {
  const { id } = use(params);
  const productId = parseInt(id, 10);

  if (isNaN(productId)) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-slate-600">Invalid product ID</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ProductForm mode="edit" productId={productId} />
    </AdminLayout>
  );
}
