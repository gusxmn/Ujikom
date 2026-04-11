import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Button } from './ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { AlertCircle, CreditCard, Loader, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentCheckoutProps {
  orderId: number;
  amount: number;
  orderNumber?: string;
  onPaymentSuccess?: (data: any) => void;
  onPaymentFailed?: (error: string) => void;
}

type PaymentMethod = 'BANK_TRANSFER' | 'E_WALLET' | 'CREDIT_CARD' | 'VIRTUAL_ACCOUNT';
type BankType = 'BCA' | 'MANDIRI' | 'BNI' | 'OTHER';
type EWalletType = 'OVO' | 'DANA' | 'GOPAY' | 'GCASH' | 'OTHER';

const PAYMENT_METHODS = {
  BANK_TRANSFER: {
    label: '💳 Transfer Bank',
    icon: '🏦',
    banks: ['BCA', 'Mandiri', 'BNI', 'BTN', 'CIMB', 'Permata', 'Lainnya'] as const,
  },
  E_WALLET: {
    label: '📱 E-Wallet',
    icon: '💰',
    wallets: ['OVO', 'Dana', 'GoPay', 'GCash', 'LinkAja', 'QRIS', 'Lainnya'] as const,
  },
  CREDIT_CARD: {
    label: '💳 Kartu Kredit',
    icon: '🎫',
    cards: ['Visa', 'Mastercard', 'AmEx', 'Lainnya'] as const,
  },
  VIRTUAL_ACCOUNT: {
    label: '🏧 Virtual Account',
    icon: '🔐',
    banks: ['BCA VA', 'BRI VA', 'Mandiri VA', 'CIMB VA', 'Permata VA', 'Lainnya'] as const,
  },
};

export function PaymentCheckout({
  orderId,
  amount,
  orderNumber,
  onPaymentSuccess,
  onPaymentFailed,
}: PaymentCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const [paymentCreated, setPaymentCreated] = useState(false);
  const [invoiceUrl, setInvoiceUrl] = useState<string>('');
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState<string>('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [selectedSubMethod, setSelectedSubMethod] = useState<string | null>(null);
  const [expandedMethod, setExpandedMethod] = useState<PaymentMethod | null>(null);

  // Calculate countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = new Date(expiresAt).getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Expired');
        clearInterval(interval);
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  // Create Payment and get Invoice
  const handleCreatePayment = async () => {
    if (!selectedMethod) {
      toast.error('❌ Pilih metode pembayaran terlebih dahulu');
      return;
    }

    try {
      setLoading(true);
      console.log('💳 Creating payment for order:', orderId, 'with method:', selectedMethod);

      // Directly create invoice (backend will create payment record if needed)
      const invoiceResponse = await api.post('/payments/create-invoice', {
        orderId,
        amount,
        paymentMethod: selectedMethod,
        paymentSubMethod: selectedSubMethod,
      });

      console.log('✅ Invoice created:', invoiceResponse.data);

      setInvoiceUrl(invoiceResponse.data.invoiceUrl);
      setExpiresAt(new Date(invoiceResponse.data.expiresAt));
      setPaymentCreated(true);

      toast.success('🎉 Invoice created! Redirecting to payment...');

      onPaymentSuccess?.(invoiceResponse.data);
    } catch (error: any) {
      console.error('❌ Payment creation failed:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Full error:', error);
      
      const errorMsg = error.response?.data?.message || error.message || 'Failed to create payment';
      const statusCode = error.response?.status;
      
      // More detailed error messages
      if (statusCode === 400) {
        console.error('❌ Bad Request - Details:', error.response?.data);
        toast.error(`❌ ${errorMsg}`);
      } else if (statusCode === 401) {
        console.error('❌ User not authenticated');
        toast.error('❌ Silakan login kembali');
      } else {
        toast.error(`❌ Error: ${errorMsg}`);
      }
      
      onPaymentFailed?.(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Open Xendit checkout
  const handleOpenPayment = () => {
    if (invoiceUrl) {
      window.open(invoiceUrl, '_blank');
    }
  };

  // Reset state
  const handleReset = () => {
    setPaymentCreated(false);
    setInvoiceUrl('');
    setExpiresAt(null);
    setCountdown('');
    setSelectedMethod(null);
    setSelectedSubMethod(null);
    setExpandedMethod(null);
  };

  if (paymentCreated && invoiceUrl) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pembayaran Pesanan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Order Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Nomor Pesanan</p>
            <p className="text-lg font-bold text-gray-900">{orderNumber || `#${orderId}`}</p>
          </div>

          {/* Amount Info */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-gray-600">Total Pembayaran</p>
            <p className="text-2xl font-bold text-green-600">
              Rp{amount.toLocaleString('id-ID')}
            </p>
          </div>

          {/* Countdown Timer */}
          {countdown && countdown !== 'Expired' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <span className="font-semibold">⏱️ Waktu Pembayaran Tersisa:</span>
              </p>
              <p className="text-xl font-bold text-yellow-600 mt-1">{countdown}</p>
            </div>
          )}

          {/* Status Messages */}
          {countdown === 'Expired' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">Pembayaran Kadaluarsa</p>
                <p className="text-sm text-red-700 mt-1">
                  Invoice telah kadaluarsa. Silakan buat pesanan baru untuk melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* Payment Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900">📋 Cara Pembayaran:</h3>
            <ol className="text-sm space-y-2 text-gray-700 list-decimal list-inside">
              <li>Klik tombol "Buka Halaman Pembayaran" di bawah</li>
              <li>Pilih metode pembayaran yang Anda sukai</li>
              <li>Ikuti instruksi untuk menyelesaikan pembayaran</li>
              <li>Pesanan akan diproses setelah pembayaran berhasil</li>
            </ol>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              className="flex-1 gap-2 bg-primary hover:bg-primary/90"
              onClick={handleOpenPayment}
              disabled={countdown === 'Expired'}
            >
              <CreditCard className="w-4 h-4" />
              Buka Halaman Pembayaran
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleReset}
            >
              Buat Invoice Baru
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-sm text-blue-800">
            <p className="font-semibold">💡 Info Penting</p>
            <p className="mt-1">
              Halaman pembayaran akan membuka di tab baru. Pastikan browser Anda mengizinkan popup untuk pengalaman terbaik.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Siap untuk Membayar?
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Order Summary */}
        <div className="space-y-2 pb-4 border-b">
          <div className="flex justify-between">
            <span className="text-gray-600">Nomor Pesanan:</span>
            <span className="font-semibold">{orderNumber || `#${orderId}`}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Total Pembayaran:</span>
            <span className="font-bold text-lg text-green-600">
              Rp{amount.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 text-base">Pilih Metode Pembayaran</h3>
          
          {(Object.entries(PAYMENT_METHODS) as [PaymentMethod, typeof PAYMENT_METHODS[PaymentMethod]][]).map(
            ([methodKey, method]) => (
              <div key={methodKey} className="space-y-2">
                {/* Method Button */}
                <button
                  onClick={() => {
                    setSelectedMethod(methodKey);
                    setExpandedMethod(expandedMethod === methodKey ? null : methodKey);
                    setSelectedSubMethod(null);
                  }}
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all flex items-center justify-between ${
                    selectedMethod === methodKey
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <span className="text-2xl">{method.icon}</span>
                    <span className="font-semibold text-gray-900">{method.label}</span>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 transition-transform ${
                      expandedMethod === methodKey ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {/* Sub-options */}
                {expandedMethod === methodKey && (
                  <div className="pl-4 space-y-2 animate-in fade-in">
                    {methodKey === 'BANK_TRANSFER' && (
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.BANK_TRANSFER.banks.map((bank) => (
                          <button
                            key={bank}
                            onClick={() => setSelectedSubMethod(bank)}
                            className={`px-3 py-2 rounded text-sm border transition-all ${
                              selectedSubMethod === bank
                                ? 'bg-blue-100 border-blue-500 text-blue-900 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    )}
                    {methodKey === 'E_WALLET' && (
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.E_WALLET.wallets.map((wallet) => (
                          <button
                            key={wallet}
                            onClick={() => setSelectedSubMethod(wallet)}
                            className={`px-3 py-2 rounded text-sm border transition-all ${
                              selectedSubMethod === wallet
                                ? 'bg-blue-100 border-blue-500 text-blue-900 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {wallet}
                          </button>
                        ))}
                      </div>
                    )}
                    {methodKey === 'CREDIT_CARD' && (
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.CREDIT_CARD.cards.map((card) => (
                          <button
                            key={card}
                            onClick={() => setSelectedSubMethod(card)}
                            className={`px-3 py-2 rounded text-sm border transition-all ${
                              selectedSubMethod === card
                                ? 'bg-blue-100 border-blue-500 text-blue-900 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {card}
                          </button>
                        ))}
                      </div>
                    )}
                    {methodKey === 'VIRTUAL_ACCOUNT' && (
                      <div className="grid grid-cols-2 gap-2">
                        {PAYMENT_METHODS.VIRTUAL_ACCOUNT.banks.map((bank) => (
                          <button
                            key={bank}
                            onClick={() => setSelectedSubMethod(bank)}
                            className={`px-3 py-2 rounded text-sm border transition-all ${
                              selectedSubMethod === bank
                                ? 'bg-blue-100 border-blue-500 text-blue-900 font-semibold'
                                : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          )}
        </div>

        {/* Selected Method Summary */}
        {selectedMethod && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-900">
              <span className="font-semibold">✓ Metode Terpilih:</span>
              <br />
              {PAYMENT_METHODS[selectedMethod].label} {selectedSubMethod && `- ${selectedSubMethod}`}
            </p>
          </div>
        )}

        {/* Create Payment Button */}
        <Button
          className="w-full gap-2 bg-primary hover:bg-primary/90 h-12 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCreatePayment}
          disabled={loading || !selectedMethod}
        >
          {loading ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Membuat Invoice...
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              Lanjutkan ke Pembayaran
            </>
          )}
        </Button>

        {/* Security Note */}
        <div className="flex gap-2 text-xs text-gray-600 bg-gray-50 p-3 rounded-lg">
          <span>🔒</span>
          <span>Pembayaran diproses oleh Xendit dengan enkripsi SSL.</span>
        </div>
      </CardContent>
    </Card>
  );
}
