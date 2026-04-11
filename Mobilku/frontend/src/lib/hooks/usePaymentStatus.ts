import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

interface PaymentStatusData {
  found?: boolean;
  id?: number;
  orderId?: number;
  amount?: string;
  status?: 'PENDING' | 'PAID' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  xenditId?: string;
  xenditInvoiceUrl?: string;
  paidAt?: string;
  createdAt?: string;
  metadata?: {
    externalId?: string;
    expiresAt?: string;
  };
  message?: string;
}

interface UsePaymentStatusOptions {
  orderId?: number;
  paymentId?: number;
  enabled?: boolean;
  refetchInterval?: number;
  onStatusChange?: (status: string) => void;
}

export function usePaymentStatus({
  orderId,
  paymentId,
  enabled = true,
  refetchInterval = 30000, // Poll every 30 seconds
  onStatusChange,
}: UsePaymentStatusOptions) {
  const [status, setStatus] = useState<string>('');
  
  // Query for polling payment status
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['payment-status', orderId || paymentId],
    queryFn: async () => {
      if (!orderId) {
        throw new Error('orderId is required');
      }

      console.log(`💳 [Payment Status] Checking payment status for order ${orderId}`);
      try {
        const response = await api.get(
          `/payments/status/${orderId}`
        );
        console.log('💳 [Payment Status] Response:', response.data);
        return response.data as PaymentStatusData;
      } catch (err: any) {
        console.error('❌ [Payment Status] Error:', err.message);
        // Return a default response if payment not found
        if (err.response?.status === 404) {
          return { found: false, status: 'PENDING', message: 'Payment not found' } as PaymentStatusData;
        }
        throw err;
      }
    },
    enabled: enabled && !!orderId,
    refetchInterval: refetchInterval,
    staleTime: 5000, // Data is fresh for 5 seconds
  });

  // Update status when data changes
  useEffect(() => {
    if (data?.status) {
      // Map PAID to COMPLETED for consistency
      const normalizedStatus = data.status === 'PAID' ? 'COMPLETED' : data.status;
      const newStatus = normalizedStatus.toLowerCase();
      if (newStatus !== status) {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      }
    }
  }, [data?.status, status, onStatusChange]);

  const mappedStatus = data?.status === 'PAID' ? 'COMPLETED' : data?.status?.toLowerCase() || 'pending';

  return {
    data,
    status: status || mappedStatus || 'pending',
    isLoading,
    isFetching,
    error,
    refetch,
    // Helper functions
    isPending: (data?.status === 'PENDING'),
    isCompleted: (data?.status === 'PAID' || data?.status === 'COMPLETED'),
    isFailed: (data?.status === 'FAILED'),
    isExpired: (data?.status === 'EXPIRED'),
    found: data?.found !== false,
  };
}

/**
 * Hook to manually check payment status without polling
 */
export function usePaymentStatusCheck() {
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string>('');

  const checkPaymentStatus = async (orderId: number) => {
    try {
      setIsChecking(true);
      setError('');
      console.log(`💳 [Payment Check] Checking payment for order ${orderId}`);

      const response = await api.get(
        `/payments/status/${orderId}`
      );

      console.log('✅ [Payment Check] Status:', response.data.status);
      return response.data as PaymentStatusData;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to check payment status';
      console.error('❌ [Payment Check] Error:', errorMsg);
      setError(errorMsg);
      throw err;
    } finally {
      setIsChecking(false);
    }
  };

  return { checkPaymentStatus, isChecking, error };
}
