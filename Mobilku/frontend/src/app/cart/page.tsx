'use client';

import ProtectedRoute from '@/lib/components/ProtectedRoute';
import CartPage from '@/lib/components/cart/page';

export default function CartPageWrapper() {
  return (
    <ProtectedRoute>
      <CartPage />
    </ProtectedRoute>
  );
}
