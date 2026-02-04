'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Shield, CreditCard, Truck } from 'lucide-react'
import ProductCard from '@/lib/components/products/ProductCard'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  // Fetch featured products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await api.get('/products?limit=6&page=1')
      return response.data.data
    },
  })

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const response = await api.get('/categories')
      return response.data
    },
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Temukan Mobil Impian Anda
          </h1>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Berbagai pilihan mobil baru dan bekas dengan kualitas terjamin dan harga terbaik
          </p>
          <Link
            href="/products"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Lihat Katalog Mobil
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Banyak Pilihan</h3>
              <p className="text-gray-600">Ratusan mobil dari berbagai merek dan tipe</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Terjamin</h3>
              <p className="text-gray-600">Garansi dan inspeksi menyeluruh</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pembayaran Aman</h3>
              <p className="text-gray-600">Berbagai metode pembayaran terpercaya</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Truck className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Pengiriman Cepat</h3>
              <p className="text-gray-600">Gratis pengiriman ke seluruh Indonesia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Mobil Terpopuler</h2>
            <Link
              href="/products"
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Lihat Semua →
            </Link>
          </div>
          
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {products?.map((product: any) => (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  image={product.image}
                  rating={product.rating}
                  reviews={product.reviews}
                  stock={product.stock}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">Belum ada mobil tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Kategori Mobil</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {categories && categories.map((category: { id: string | number; name?: string; _count?: { products?: number } }) => (
              <Link
                key={category.id}
                href={`/products?category=${category.id}`}
                className="bg-gray-50 hover:bg-blue-50 border rounded-lg p-4 text-center transition group"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-200">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="font-semibold">{category.name}</h3>
                <p className="text-sm text-gray-500">{category._count?.products || 0} mobil</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Siap Memiliki Mobil Impian?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Daftar sekarang dan dapatkan penawaran spesial untuk pembelian pertama
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/products"
              className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              Lihat Mobil Tersedia
            </Link>
            {user && user.role === 'customer' && (
              <Link
                href="/cart"
                className="inline-block bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
              >
                Lihat Keranjang
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}