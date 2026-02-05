'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { Input } from '@/lib/components/ui/Input';
import { ShoppingCart, Heart, Star, Search, Filter, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';

export default function ProductsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', searchTerm, selectedCategory],
    queryFn: async () => {
      let url = '/products?limit=20&page=1';
      if (searchTerm) url += `&search=${searchTerm}`;
      if (selectedCategory) url += `&category=${selectedCategory}`;
      const response = await api.get(url);
      return response.data.data || [];
    },
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories');
      return response.data || [];
    },
  });

  if (!user) {
    return null;
  }

  const handleAddToCart = (productId: string) => {
    toast.success('Item ditambahkan ke keranjang!');
  };

  const handleAddToWishlist = (productId: string) => {
    toast.success('Item ditambahkan ke wishlist!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Produk Mobil</h1>
          <p className="text-gray-600 mt-2">Jelajahi koleksi mobil kami yang lengkap</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Filters */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Cari Produk
                  </label>
                  <Input
                    placeholder="Cari mobil..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Categories */}
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    Kategori
                  </label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedCategory('')}
                      className={`w-full text-left px-3 py-2 rounded ${
                        !selectedCategory
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Semua Kategori
                    </button>
                    {categories?.map((category: any) => (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedCategory === category.id
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Products */}
          <div className="lg:col-span-3">
            {productsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                    <div className="h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : products && products.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {products.map((product: any) => (
                  <Card key={product.id} className="hover:shadow-lg transition">
                    <div className="h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {product.description || 'Deskripsi tidak tersedia'}
                      </p>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-3">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {product.rating || 0}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({product.reviews || 0} reviews)
                        </span>
                      </div>

                      {/* Price */}
                      <div className="text-lg font-bold text-blue-600 mb-4">
                        Rp {product.price?.toLocaleString('id-ID') || '0'}
                      </div>

                      {/* Stock */}
                      <div className="text-sm mb-4">
                        {product.stock && product.stock > 0 ? (
                          <span className="text-green-600 font-medium">
                            Stok: {product.stock}
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">Stok Habis</span>
                        )}
                      </div>

                      {/* Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          fullWidth
                          onClick={() => handleAddToCart(product.id)}
                          disabled={!product.stock || product.stock <= 0}
                          className="gap-2"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Beli
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleAddToWishlist(product.id)}
                          className="p-2"
                        >
                          <Heart className="w-5 h-5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-12">
                  <p className="text-gray-500 mb-4">Produk tidak ditemukan</p>
                  <Button
                    variant="primary"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('');
                    }}
                  >
                    Reset Filter
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
