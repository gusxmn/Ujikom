import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Package, Truck, Home } from 'lucide-react';

interface OrderStatusTrackerProps {
  orderId: number;
  initialStatus: string;
  onStatusChange?: (status: string) => void;
}

export function OrderStatusTracker({ orderId, initialStatus, onStatusChange }: OrderStatusTrackerProps) {
  const [status, setStatus] = useState(initialStatus.toLowerCase());
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Try to listen for real-time updates if SocketProvider is available
  useEffect(() => {
    try {
      const socketModule = require('@/lib/contexts/SocketContext');
      const useSocket = socketModule.useSocket;
      const socketContext = useSocket();

      if (socketContext?.onOrderUpdate) {
        socketContext.onOrderUpdate((data: any) => {
          if (data.orderId === orderId) {
            console.log('📦 Order status updated:', data.status);
            setStatus(data.status.toLowerCase());
            setLastUpdate(new Date());
            onStatusChange?.(data.status);
          }
        });
      }
    } catch (error) {
      // SocketProvider not available - status will remain static
      console.log('⚠️ [OrderStatusTracker] Real-time updates not available');
    }
  }, [orderId, onStatusChange]);

  const getStatusIcon = (currentStatus: string) => {
    const s = currentStatus.toLowerCase();
    switch (s) {
      case 'pending':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'processing':
      case 'confirmed':
        return <Package className="w-5 h-5 text-blue-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-purple-500" />;
      case 'delivered':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusLabel = (s: string) => {
    const labelMap: Record<string, string> = {
      pending: '⏳ Menunggu Pembayaran',
      processing: '📦 Sedang Diproses',
      confirmed: '✅ Confirmed',
      shipped: '🚚 Dalam Pengiriman',
      delivered: '🏠 Sampai Tujuan',
      cancelled: '❌ Dibatalkan',
    };
    return labelMap[s] || s;
  };

  const getStatusColor = (s: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 border-yellow-200 text-yellow-800',
      processing: 'bg-blue-100 border-blue-200 text-blue-800',
      confirmed: 'bg-green-100 border-green-200 text-green-800',
      shipped: 'bg-purple-100 border-purple-200 text-purple-800',
      delivered: 'bg-green-100 border-green-200 text-green-800',
      cancelled: 'bg-red-100 border-red-200 text-red-800',
    };
    return colorMap[s] || 'bg-gray-100 border-gray-200 text-gray-800';
  };

  return (
    <div className="space-y-4">
      {/* Current Status Badge */}
      <div className={`p-4 rounded-lg border-2 flex items-center gap-3 ${getStatusColor(status)}`}>
        {getStatusIcon(status)}
        <div>
          <p className="font-semibold">{getStatusLabel(status)}</p>
          <p className="text-sm opacity-75">
            Last update: {lastUpdate.toLocaleTimeString('id-ID')}
          </p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="space-y-3">
        {['pending', 'processing', 'shipped', 'delivered'].map((step, idx) => {
          const statusOrder = ['pending', 'processing', 'shipped', 'delivered'];
          const currentIdx = statusOrder.indexOf(status);
          const isCompleted = statusOrder.indexOf(step) <= currentIdx;
          const isActive = step === status;

          return (
            <div key={step} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white'
                    : isActive
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}
              >
                {isCompleted ? '✓' : idx + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  isActive ? 'text-blue-600 font-bold' : isCompleted ? 'text-green-600' : 'text-gray-500'
                }`}
              >
                {getStatusLabel(step)}
              </span>
              {idx < 3 && (
                <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
