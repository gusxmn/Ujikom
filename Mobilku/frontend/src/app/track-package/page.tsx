'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import {
  Package,
  Truck,
  CheckCircle,
  MapPin,
  Clock,
  Search,
  AlertCircle,
  Home,
  Building2,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface TrackingStatus {
  status: 'processing' | 'shipped' | 'in-transit' | 'out-for-delivery' | 'delivered';
  date: string;
  time: string;
  location: string;
  description: string;
}

interface PackageData {
  trackingNumber: string;
  orderNumber: string;
  status: 'processing' | 'shipped' | 'in-transit' | 'out-for-delivery' | 'delivered';
  carrier: string;
  estimatedDelivery: string;
  shippingAddress: {
    name: string;
    phone: string;
    address: string;
    city: string;
    zipCode: string;
  };
  timeline: TrackingStatus[];
}

const MOCK_PACKAGES: Record<string, PackageData> = {
  'TRK123456789': {
    trackingNumber: 'TRK123456789',
    orderNumber: 'ORD-2026-001',
    status: 'in-transit',
    carrier: 'JNE',
    estimatedDelivery: '2026-04-15',
    shippingAddress: {
      name: 'John Doe',
      phone: '+62 812-3456-7890',
      address: 'Jl. Merdeka No. 123',
      city: 'Jakarta Selatan',
      zipCode: '12345',
    },
    timeline: [
      {
        status: 'processing',
        date: '2026-04-11',
        time: '10:30',
        location: 'Warehouse Jakarta',
        description: 'Paket sedang diproses',
      },
      {
        status: 'shipped',
        date: '2026-04-11',
        time: '14:45',
        location: 'JNE Distribution Center',
        description: 'Paket telah dikirim',
      },
      {
        status: 'in-transit',
        date: '2026-04-12',
        time: '08:15',
        location: 'Sorting Center Tangerang',
        description: 'Paket dalam perjalanan',
      },
    ],
  },
  'TRK987654321': {
    trackingNumber: 'TRK987654321',
    orderNumber: 'ORD-2026-002',
    status: 'delivered',
    carrier: 'Pos Indonesia',
    estimatedDelivery: '2026-04-10',
    shippingAddress: {
      name: 'Jane Smith',
      phone: '+62 821-9876-5432',
      address: 'Jl. Ahmad Yani No. 456',
      city: 'Bandung',
      zipCode: '40123',
    },
    timeline: [
      {
        status: 'processing',
        date: '2026-04-08',
        time: '11:00',
        location: 'Warehouse Jakarta',
        description: 'Paket sedang diproses',
      },
      {
        status: 'shipped',
        date: '2026-04-08',
        time: '16:30',
        location: 'Pos Indonesia Hub',
        description: 'Paket telah dikirim',
      },
      {
        status: 'in-transit',
        date: '2026-04-09',
        time: '09:00',
        location: 'Sorting Center Bandung',
        description: 'Paket dalam perjalanan',
      },
      {
        status: 'out-for-delivery',
        date: '2026-04-10',
        time: '07:30',
        location: 'Bandung Delivery Station',
        description: 'Paket dalam pengiriman',
      },
      {
        status: 'delivered',
        date: '2026-04-10',
        time: '15:45',
        location: 'Bandung',
        description: 'Paket telah diterima',
      },
    ],
  },
};

const STATUS_INFO = {
  processing: {
    label: 'Diproses',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    description: 'Paket sedang disiapkan untuk pengiriman',
  },
  shipped: {
    label: 'Dikirim',
    color: 'bg-purple-100 text-purple-800',
    icon: Truck,
    description: 'Paket telah meninggalkan warehouse',
  },
  'in-transit': {
    label: 'Dalam Perjalanan',
    color: 'bg-orange-100 text-orange-800',
    icon: Truck,
    description: 'Paket sedang dalam perjalanan',
  },
  'out-for-delivery': {
    label: 'Siap Diantar',
    color: 'bg-green-100 text-green-800',
    icon: Home,
    description: 'Paket sedang diantar ke alamat Anda',
  },
  delivered: {
    label: 'Tiba',
    color: 'bg-emerald-100 text-emerald-800',
    icon: CheckCircle,
    description: 'Paket telah tiba di tujuan',
  },
};

export default function TrackPackagePage() {
  const searchParams = useSearchParams();
  const [trackingNumber, setTrackingNumber] = useState('');
  const [packageData, setPackageData] = useState<PackageData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Auto-search if tracking number is provided in URL
  useEffect(() => {
    const tracking = searchParams.get('tracking');
    if (tracking) {
      setTrackingNumber(tracking.toUpperCase());
      performSearch(tracking.toUpperCase());
    }
  }, [searchParams]);

  const performSearch = async (trackNum: string) => {
    if (!trackNum.trim()) {
      toast.error('Masukkan nomor tracking');
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get(`/package-tracking/search/${trackNum.toUpperCase()}`);
      setHasSearched(true);
      
      if (response.data?.success) {
        setPackageData(response.data.data);
        toast.success('Data paket ditemukan');
      } else {
        setPackageData(null);
        toast.error('Nomor tracking tidak ditemukan');
      }
    } catch (error: any) {
      setHasSearched(true);
      setPackageData(null);
      const errorMessage = error.response?.data?.message || 'Nomor tracking tidak ditemukan';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    await performSearch(trackingNumber);
  };

  const getStatusIcon = (status: string) => {
    const Icon = (STATUS_INFO[status as keyof typeof STATUS_INFO]?.icon) || Package;
    return Icon;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lacak Paket</h1>
          <p className="text-gray-600">Pantau status pengiriman paket Anda secara real-time</p>
        </div>

        {/* Search Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Masukkan Nomor Tracking</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input
                placeholder="Contoh: TRK123456789"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading}
                className="gap-2"
              >
                <Search className="w-4 h-4" />
                {isLoading ? 'Mencari...' : 'Cari'}
              </Button>
            </form>
            <p className="text-sm text-gray-500 mt-3">
              💡 Coba: TRK123456789 atau TRK987654321
            </p>
          </CardContent>
        </Card>

        {/* Results */}
        {hasSearched && (
          <>
            {packageData ? (
              <div className="space-y-6">
                {/* Status Overview */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle>Status Pengiriman</CardTitle>
                        <p className="text-sm text-gray-600 mt-1">
                          Nomor Pesanan: {packageData.orderNumber}
                        </p>
                      </div>
                      <div className={`px-4 py-2 rounded-lg font-semibold ${
                        STATUS_INFO[packageData.status].color
                      }`}>
                        {STATUS_INFO[packageData.status].label}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Kurir Pengiriman</p>
                        <p className="font-semibold text-gray-900">{packageData.carrier}</p>
                      </div>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Perkiraan Tiba</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(packageData.estimatedDelivery).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Timeline */}
                <Card>
                  <CardHeader>
                    <CardTitle>Riwayat Pengiriman</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {packageData.timeline.map((event, index) => {
                        const Icon = getStatusIcon(event.status);
                        const isLast = index === packageData.timeline.length - 1;
                        return (
                          <div key={index} className="flex gap-4">
                            {/* Timeline dot and line */}
                            <div className="flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                event.status === 'delivered' || event.status === 'out-for-delivery'
                                  ? 'bg-green-100'
                                  : 'bg-blue-100'
                              }`}>
                                <Icon className={`w-4 h-4 ${
                                  event.status === 'delivered' || event.status === 'out-for-delivery'
                                    ? 'text-green-600'
                                    : 'text-blue-600'
                                }`} />
                              </div>
                              {!isLast && (
                                <div className="w-0.5 h-12 bg-gray-200 my-2" />
                              )}
                            </div>
                            {/* Timeline content */}
                            <div className="pb-4 flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-semibold text-gray-900">{event.description}</p>
                                  <p className="text-sm text-gray-600 mt-1">{event.location}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-medium text-gray-900">{event.date}</p>
                                  <p className="text-xs text-gray-500">{event.time}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      Alamat Pengiriman
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">Penerima</p>
                        <p className="font-semibold text-gray-900">{packageData.shippingAddress.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Nomor Telepon</p>
                        <p className="font-semibold text-gray-900">{packageData.shippingAddress.phone}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Alamat Lengkap</p>
                        <p className="font-semibold text-gray-900">
                          {packageData.shippingAddress.address}, {packageData.shippingAddress.city}, {packageData.shippingAddress.zipCode}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Info Box */}
                {packageData.status === 'delivered' && (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-emerald-900">Paket telah tiba</p>
                      <p className="text-sm text-emerald-700">Terima kasih telah berbelanja dengan kami!</p>
                    </div>
                  </div>
                )}

                {packageData.status === 'out-for-delivery' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
                    <Truck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900">Paket sedang diantar hari ini</p>
                      <p className="text-sm text-blue-700">Harap bersiaplah menerima paket Anda.</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="py-12">
                  <div className="text-center">
                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4 opacity-50" />
                    <p className="text-gray-600 font-medium">Nomor tracking tidak ditemukan</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Pastikan nomor tracking yang Anda masukkan sudah benar
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Help Section */}
        {!hasSearched && (
          <Card>
            <CardHeader>
              <CardTitle>Bagaimana cara melacak paket?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                    1
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Cari nomor tracking</p>
                  <p className="text-sm text-gray-600">Nomor tracking ada di email konfirmasi atau halaman pesanan Anda</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                    2
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Masukkan di kolom pencarian</p>
                  <p className="text-sm text-gray-600">Bentuk nomor tracking biasanya 'TRK' diikuti dengan angka</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center font-semibold text-blue-600">
                    3
                  </div>
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Lihat status pengiriman</p>
                  <p className="text-sm text-gray-600">Anda akan melihat timeline lengkap perjalanan paket Anda</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
