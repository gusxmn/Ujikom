import { useEffect, useState } from 'react';
import { useSocket } from '@/lib/contexts/SocketContext';
import { AlertCircle, CheckCircle2, Clock, XCircle, ExternalLink } from 'lucide-react';
import { Button } from './ui/Button';

interface PaymentStatusTrackerProps {
  paymentId: number;
  orderId: number;
  initialStatus: string;
  invoiceUrl?: string;
  expiresAt?: Date;
  amount?: number;
  onStatusChange?: (status: string) => void;
}

export function PaymentStatusTracker({
  paymentId,
  orderId,
  initialStatus,
  invoiceUrl,
  expiresAt,
  amount,
  onStatusChange,
}: PaymentStatusTrackerProps) {
  const { onPaymentUpdate, onPaymentInvoice } = useSocket();
  const [status, setStatus] = useState(initialStatus.toLowerCase());
  const [currentInvoiceUrl, setCurrentInvoiceUrl] = useState(invoiceUrl);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Handle invoice URL updates
  useEffect(() => {
    onPaymentInvoice((data) => {
      if (data.orderId === orderId) {
        console.log('📄 Payment invoice received:', data);
        setCurrentInvoiceUrl(data.invoiceUrl);
      }
    });
  }, [orderId, onPaymentInvoice]);

  // Handle payment status updates
  useEffect(() => {
    onPaymentUpdate((data) => {
      if (data.paymentId === paymentId) {
        console.log('💳 Payment status updated:', data.status);
        setStatus(data.status.toLowerCase());
        setLastUpdate(new Date());
        onStatusChange?.(data.status);
      }
    });
  }, [paymentId, onStatusChange, onPaymentUpdate]);

  // Calculate time remaining
  useEffect(() => {
    if (!expiresAt || status !== 'pending') return;

    const interval = setInterval(() => {
      const now = new Date();
      const expires = new Date(expiresAt);
      const diff = expires.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeRemaining('Expired');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, status]);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'expired':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = () => {
    const labelMap: Record<string, string> = {
      pending: '⏳ Menunggu Pembayaran',
      completed: '✅ Pembayaran Berhasil',
      success: '✅ Pembayaran Berhasil',
      failed: '❌ Pembayaran Gagal',
      expired: '⏰ Pembayaran Kadaluarsa',
    };
    return labelMap[status] || status;
  };

  const getStatusColor = () => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 border-yellow-200 text-yellow-800',
      completed: 'bg-green-100 border-green-200 text-green-800',
      success: 'bg-green-100 border-green-200 text-green-800',
      failed: 'bg-red-100 border-red-200 text-red-800',
      expired: 'bg-orange-100 border-orange-200 text-orange-800',
    };
    return colorMap[status] || 'bg-gray-100 border-gray-200 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Current Status Badge */}
      <div className={`p-4 rounded-lg border-2 flex items-center justify-between ${getStatusColor()}`}>
        <div className="flex items-center gap-3">
          {getStatusIcon()}
          <div>
            <p className="font-semibold">{getStatusLabel()}</p>
            <p className="text-sm opacity-75">
              Last update: {lastUpdate.toLocaleTimeString('id-ID')}
            </p>
          </div>
        </div>

        {/* Payment Amount */}
        {amount && (
          <div className="text-right">
            <p className="text-lg font-bold">Rp{amount.toLocaleString('id-ID')}</p>
          </div>
        )}
      </div>

      {/* Countdown Timer */}
      {status === 'pending' && timeRemaining && timeRemaining !== 'Expired' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            <span className="font-semibold">⏱️ Waktu tersisa:</span> {timeRemaining}
          </p>
        </div>
      )}

      {/* Payment Invoice Link */}
      {status === 'pending' && currentInvoiceUrl && (
        <Button
          className="w-full gap-2 bg-primary hover:bg-primary/90"
          onClick={() => window.open(currentInvoiceUrl, '_blank')}
        >
          <ExternalLink className="w-4 h-4" />
          Buka Halaman Pembayaran
        </Button>
      )}

      {/* Success Message */}
      {(status === 'completed' || status === 'success') && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 font-medium">
            ✅ Terima kasih! Pembayaran Anda telah berhasil. Pesanan sedang dipersiapkan.
          </p>
        </div>
      )}

      {/* Failure Message */}
      {status === 'failed' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">
            ❌ Pembayaran gagal. Silakan coba lagi atau hubungi customer service.
          </p>
        </div>
      )}

      {/* Expired Message */}
      {status === 'expired' && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-orange-800 font-medium">
            ⏰ Invoice telah kadaluarsa. Silakan buat pesanan baru untuk melanjutkan.
          </p>
        </div>
      )}
    </div>
  );
}
