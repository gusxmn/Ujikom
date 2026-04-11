'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import ProtectedRoute from '@/lib/components/ProtectedRoute';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { MapPin, Trash2, Check, X, Plus, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Address {
  id: number;
  label: string;
  recipient: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  isPrimary: boolean;
  createdAt: string;
}

type CreateAddressFormData = Omit<Address, 'id' | 'isPrimary' | 'createdAt'>;

export default function AddressesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    recipient: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
  });

  // Get redirect URL from query params
  const redirectUrl = searchParams.get('redirect') || '/cart';

  // Fetch addresses
  const { data: addresses = [], isLoading } = useQuery({
    queryKey: ['shipping-addresses'],
    queryFn: async () => {
      const response = await api.get('/shipping-addresses');
      return response.data;
    },
    enabled: !!user,
  });

  // Auto-load address when in edit mode from query params
  useEffect(() => {
    const editId = searchParams.get('edit');
    if (editId && addresses && addresses.length > 0) {
      const addressId = parseInt(editId, 10);
      const addressToEdit = addresses.find((addr: Address) => addr.id === addressId);
      if (addressToEdit) {
        setEditingId(addressToEdit.id);
        setFormData({
          label: addressToEdit.label,
          recipient: addressToEdit.recipient,
          phone: addressToEdit.phone,
          address: addressToEdit.address,
          city: addressToEdit.city,
          province: addressToEdit.province,
          postalCode: addressToEdit.postalCode,
        });
        setShowForm(true);
      }
    }
  }, [addresses, searchParams]);

  // Create address mutation
  const createMutation = useMutation({
    mutationFn: async (data: CreateAddressFormData) => {
      return await api.post('/shipping-addresses', data);
    },
    onSuccess: () => {
      toast.success('Alamat berhasil ditambahkan!');
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      resetForm();
      // Redirect if coming from checkout
      if (redirectUrl && redirectUrl !== '/cart') {
        router.push(redirectUrl);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menambahkan alamat');
    },
  });

  // Update address mutation
  const updateMutation = useMutation({
    mutationFn: async (data: CreateAddressFormData) => {
      return await api.patch(`/shipping-addresses/${editingId}`, data);
    },
    onSuccess: () => {
      toast.success('Alamat berhasil diperbarui!');
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
      resetForm();
      // Redirect if coming from checkout
      if (redirectUrl && redirectUrl !== '/cart') {
        router.push(redirectUrl);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal memperbarui alamat');
    },
  });

  // Set primary address mutation
  const setPrimaryMutation = useMutation({
    mutationFn: async (addressId: number) => {
      return await api.patch(`/shipping-addresses/${addressId}/set-primary`);
    },
    onSuccess: () => {
      toast.success('Alamat utama berhasil diubah!');
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal mengubah alamat utama');
    },
  });

  // Delete address mutation
  const deleteMutation = useMutation({
    mutationFn: async (addressId: number) => {
      return await api.delete(`/shipping-addresses/${addressId}`);
    },
    onSuccess: () => {
      toast.success('Alamat berhasil dihapus!');
      queryClient.invalidateQueries({ queryKey: ['shipping-addresses'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Gagal menghapus alamat');
    },
  });

  const resetForm = () => {
    setFormData({
      label: '',
      recipient: '',
      phone: '',
      address: '',
      city: '',
      province: '',
      postalCode: '',
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label || !formData.recipient || !formData.phone || !formData.address || !formData.city || !formData.province || !formData.postalCode) {
      toast.error('Semua field harus diisi!');
      return;
    }

    if (editingId) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (address: Address) => {
    setEditingId(address.id);
    setFormData({
      label: address.label,
      recipient: address.recipient,
      phone: address.phone,
      address: address.address,
      city: address.city,
      province: address.province,
      postalCode: address.postalCode,
    });
    setShowForm(true);
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Alamat Pengiriman</h1>
              <p className="text-black mt-2">Kelola alamat pengiriman Anda</p>
            </div>
            <Link href={redirectUrl}>
              <Button variant="outline">← {redirectUrl === '/checkout' ? 'Kembali ke Checkout' : 'Kembali ke Cart'}</Button>
            </Link>
          </div>

          {/* Add Address Button */}
          {!showForm && (
            <Button
              className="mb-6 gap-2"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4" />
              Tambah Alamat
            </Button>
          )}

          {/* Form */}
          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{editingId ? 'Edit Alamat' : 'Tambah Alamat Baru'}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Label Alamat</label>
                      <Input
                        placeholder="Rumah, Kantor, dll"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Nama Penerima</label>
                      <Input
                        placeholder="John Doe"
                        value={formData.recipient}
                        onChange={(e) => setFormData({ ...formData, recipient: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2">Nomor Telepon</label>
                      <Input
                        placeholder="+62812345678"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-black mb-2">Alamat Lengkap</label>
                      <Input
                        placeholder="Jl. Contoh No. 123"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Kota</label>
                      <Input
                        placeholder="Jakarta"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Provinsi</label>
                      <Input
                        placeholder="DKI Jakarta"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-black mb-2">Kode Pos</label>
                      <Input
                        placeholder="12345"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-blue-600"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingId ? 'Perbarui' : 'Simpan'} Alamat
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Batal
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Addresses List */}
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-black">Memuat alamat...</p>
            </div>
          ) : addresses.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-black">Belum ada alamat. Silakan tambahkan alamat baru.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {addresses.map((address: Address) => (
                <Card key={address.id} className={address.isPrimary ? 'border-blue-500 border-2' : ''}>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-black text-lg">{address.label}</h3>
                          {address.isPrimary && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-semibold">
                              Utama
                            </span>
                          )}
                        </div>
                        <p className="text-black text-sm font-medium mb-1">Penerima: {address.recipient}</p>
                        <p className="text-black text-sm mb-1">
                          {address.address}
                        </p>
                        <p className="text-black text-sm mb-1">
                          {address.city}, {address.province} {address.postalCode}
                        </p>
                        <p className="text-black text-sm">📱 {address.phone}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(address)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        {!address.isPrimary && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPrimaryMutation.mutate(address.id)}
                            disabled={setPrimaryMutation.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600"
                          onClick={() => deleteMutation.mutate(address.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
