'use client';

import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usePaymentStatus } from '@/lib/hooks/usePaymentStatus';

interface PaymentStatusColumnProps {
  orderId: number;
}

const statusConfig = {
  pending: {
    icon: Clock,
    label: 'Menunggu',
    color: 'text-yellow-600 bg-yellow-50',
    borderColor: 'border-yellow-200',
  },
  completed: {
    icon: CheckCircle,
    label: 'Berhasil',
    color: 'text-green-600 bg-green-50',
    borderColor: 'border-green-200',
  },
  failed: {
    icon: XCircle,
    label: 'Gagal',
    color: 'text-red-600 bg-red-50',
    borderColor: 'border-red-200',
  },
  expired: {
    icon: AlertCircle,
    label: 'Kadaluarsa',
    color: 'text-orange-600 bg-orange-50',
    borderColor: 'border-orange-200',
  },
};

export function PaymentStatusColumn({ orderId }: PaymentStatusColumnProps) {
  const { status, isLoading, data } = usePaymentStatus({
    orderId,
    enabled: true,
    refetchInterval: 60000, // Check every minute in list view
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-spin">
          <Clock className="w-4 h-4 text-gray-400" />
        </div>
        <span className="text-gray-500 text-sm">Memuat...</span>
      </div>
    );
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded border ${config.color} ${config.borderColor}`}>
      <Icon className="w-4 h-4" />
      <span className="font-medium text-sm">{config.label}</span>
      
      {/* Show amount for completed payments */}
      {data?.status === 'COMPLETED' && data?.amount && (
        <span className="text-xs text-gray-600 ml-auto">
          Rp {new Intl.NumberFormat('id-ID').format(parseFloat(data.amount))}
        </span>
      )}
    </div>
  );
}

/**
 * Standalone payment status indicator with more details
 */
export function PaymentStatusBadge({ orderId }: PaymentStatusColumnProps) {
  const { status, data } = usePaymentStatus({
    orderId,
    enabled: true,
  });

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${config.color} ${config.borderColor}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </div>
  );
}
