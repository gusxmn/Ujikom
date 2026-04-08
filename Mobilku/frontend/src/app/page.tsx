'use client'

import { useAuth } from '@/lib/contexts/AuthContext'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Car, Shield, CreditCard, Truck, ChevronRight, Star } from 'lucide-react'
import ProductCard from '@/lib/components/products/ProductCard'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading) {
      // Redirect admin to dashboard
      if (user && user.role === 'ADMIN') {
        router.push('/admin')
      }
      // Redirect non-authenticated users to login
      if (!user) {
        router.push('/login')
      }
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
          <p className="mt-4 text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section - Premium Design */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 text-white py-32">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-96 h-96 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="mb-4 inline-block">
                <span className="bg-blue-500/20 text-blue-100 px-4 py-2 rounded-full text-sm font-semibold border border-blue-500/50">
                  Mobilku - Temukan Mobil Impian Anda
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-black mb-6 leading-tight">
                Temukan Mobil <span className="text-blue-400">Impian Anda</span>
              </h1>
              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                Mobil baru & bekas berkualitas dengan harga terbaik. Berbagai pilihan dari berbagai merek terkemuka dengan garansi dan inspeksi menyeluruh
              </p>
              <div className="flex gap-4 flex-col sm:flex-row">
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center bg-white text-blue-900 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition transform hover:scale-105"
                >
                  Beli Sekarang <ChevronRight className="ml-2 w-5 h-5" />
                </Link>
                <Link
                  href="/products"
                  className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-lg font-bold hover:bg-white/10 transition"
                >
                  Jelajahi Katalog
                </Link>
              </div>
            </div>

            {/* Right - Car Image Placeholder */}
            <div className="relative hidden lg:block">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-400/20 to-transparent rounded-3xl"></div>
              <div className="h-96 bg-gradient-to-br from-blue-400 to-blue-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Car className="w-48 h-48 text-white/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Modern Cards */}
      <section className="py-20 bg-white relative">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature Card 1 */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-lg transition duration-300 border border-blue-200">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Car className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Banyak Pilihan</h3>
              <p className="text-slate-600">Ratusan mobil dari berbagai merek dan type tersedia</p>
            </div>

            {/* Feature Card 2 */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-lg transition duration-300 border border-green-200">
              <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Terjamin</h3>
              <p className="text-slate-600">Garansi dan inspeksi menyeluruh untuk setiap mobil</p>
            </div>

            {/* Feature Card 3 */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-lg transition duration-300 border border-purple-200">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pembayaran Aman</h3>
              <p className="text-slate-600">Berbagai metode pembayaran terpercaya</p>
            </div>

            {/* Feature Card 4 */}
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-8 hover:shadow-lg transition duration-300 border border-orange-200">
              <div className="w-14 h-14 bg-orange-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Truck className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Pengiriman Cepat</h3>
              <p className="text-slate-600">Gratis pengiriman ke seluruh Indonesia</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-4xl font-bold text-slate-900">Mobil Terpopuler</h2>
              <p className="text-slate-600 mt-2">Pilihan terbaik dan paling dicari pelanggan kami</p>
            </div>
            <Link
              href="/products"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold text-lg hover:gap-4 transition"
            >
              Lihat Semua <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          
          {productsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-md p-6 animate-pulse">
                  <div className="h-64 bg-gray-200 rounded-xl mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
              <p className="text-gray-900">Belum ada mobil tersedia</p>
            </div>
          )}
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900">Kategori Mobil</h2>
            <p className="text-slate-600 mt-2">Temukan mobil impian Anda berdasarkan kategori</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categories && categories.map((category: { id: string | number; name?: string; _count?: { products?: number } }) => (
              <Link
                key={category.id}
                href={`/products?categoryId=${category.id}`}
                className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center transition hover:shadow-xl border border-blue-200 hover:border-blue-400"
              >
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-700 group-hover:scale-110 transition">
                  <Car className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-bold text-slate-900 text-lg">{category.name}</h3>
                <p className="text-sm text-slate-600 mt-1">{category._count?.products || 0} mobil</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Premium */}
      <section className="relative py-24 text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800"></div>
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-40 -top-40 w-80 h-80 bg-blue-500 rounded-full opacity-20 blur-3xl"></div>
          <div className="absolute -left-40 -bottom-40 w-80 h-80 bg-blue-700 rounded-full opacity-20 blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6">
              Siap Memiliki Mobil Impian?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Daftar sekarang dan dapatkan penawaran spesial untuk pembelian pertama Anda
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/products"
                className="inline-flex items-center justify-center bg-white text-blue-600 px-8 py-4 rounded-lg font-bold hover:bg-blue-50 transition transform hover:scale-105"
              >
                Lihat Mobil Tersedia <ChevronRight className="ml-2 w-5 h-5" />
              </Link>
              {user && user.role === 'CUSTOMER' && (
                <Link
                  href="/cart"
                  className="inline-flex items-center justify-center bg-blue-700 text-white px-8 py-4 rounded-lg font-bold hover:bg-blue-800 transition border border-blue-500"
                >
                  Lihat Keranjang
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}