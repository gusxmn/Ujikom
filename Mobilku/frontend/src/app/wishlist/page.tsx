'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import ProtectedRoute from '@/lib/components/ProtectedRoute';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent } from '@/lib/components/ui/Card';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Eye,
  LayoutGrid,
  List,
  ArrowLeft,
} from 'lucide-react';
import { formatPrice, getFirstImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

type SortOption = 'recent' | 'price-low' | 'price-high' | 'name';
type ViewMode = 'grid' | 'list';

export default function WishlistPage() {
  const router = useRouter();
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Fetch wishlist
  const { data: wishlistData, isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const response = await api.get(`/wishlist`);
      // Backend returns: { id, userId, items: [...], ... }
      return response.data?.items || [];
    },
    staleTime: 0, // Always refetch when component mounts
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: async (productId: number) => {
      await api.post('/cart', { productId, quantity: 1 });
    },
    onSuccess: () => {
      toast.success('Added to cart');
    },
    onError: () => {
      toast.error('Failed to add to cart');
    },
  });

  // Remove from wishlist mutation
  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId: number) => {
      await api.delete(`/wishlist/remove/${productId}`);
    },
    onSuccess: () => {
      toast.success('Removed from wishlist');
      refetch();
    },
    onError: () => {
      toast.error('Failed to remove from wishlist');
    },
  });

  // Remove selected items
  const handleRemoveSelected = async () => {
    try {
      await Promise.all(
        selectedItems.map(id => removeFromWishlistMutation.mutateAsync(id))
      );
      setSelectedItems([]);
      refetch();
    } catch (error) {
      toast.error('Failed to remove items');
    }
  };

  // Add selected to cart
  const handleAddSelectedToCart = async () => {
    try {
      await Promise.all(
        selectedItems.map(id => addToCartMutation.mutateAsync(id))
      );
      setSelectedItems([]);
    } catch (error) {
      toast.error('Failed to add items to cart');
    }
  };

  // Select all
  const handleSelectAll = () => {
    if (selectedItems.length === wishlistData?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlistData?.map((item: any) => item.productId) || []);
    }
  };

  // Toggle item selection
  const handleToggleItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="mb-10">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mb-6 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            <div className="bg-gradient-to-r from-red-500 via-red-500 to-red-600 text-white rounded-2xl p-10 shadow-xl">
              <div className="flex items-center gap-4 mb-3">
                <div className="p-3 bg-white/20 rounded-full">
                  <Heart size={32} className="fill-white" />
                </div>
                <div>
                  <h1 className="text-5xl font-bold">My Wishlist</h1>
                  <p className="text-red-100 mt-1">{wishlistData?.length || 0} item{wishlistData?.length !== 1 ? 's' : ''} saved</p>
                </div>
              </div>
            </div>
          </div>

          {wishlistData && wishlistData.length > 0 ? (
            <>
              {/* Toolbar */}
              <div className="bg-white rounded-2xl shadow-sm p-6 mb-10 border border-gray-200">
                <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                  {/* Bulk Actions */}
                  <div className="flex flex-wrap gap-4 items-center">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === wishlistData?.length && wishlistData?.length > 0}
                        onChange={handleSelectAll}
                        className="w-5 h-5 rounded accent-blue-600 cursor-pointer"
                        title="Select all"
                      />
                      <span className="text-sm text-gray-700 font-medium">
                        {selectedItems.length > 0 ? `${selectedItems.length} selected` : 'Select all'}
                      </span>
                    </label>
                    {selectedItems.length > 0 && (
                      <div className="flex gap-2 border-l border-gray-200 pl-4">
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleAddSelectedToCart}
                        >
                          <ShoppingCart size={16} className="mr-2" /> Add to Cart
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={handleRemoveSelected}
                        >
                          <Trash2 size={16} className="mr-2" /> Remove
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Sort and View */}
                  <div className="flex gap-4 items-center">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 font-medium text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="recent">Recent</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="name">Name A-Z</option>
                    </select>

                    <div className="flex gap-2 border border-gray-300 rounded-lg p-1 bg-gray-50">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition ${
                          viewMode === 'grid'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="Grid view"
                      >
                        <LayoutGrid size={18} />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2 rounded-md transition ${
                          viewMode === 'list'
                            ? 'bg-blue-600 text-white shadow-md'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}
                        title="List view"
                      >
                        <List size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {wishlistData?.map((item: any) => (
                    <div
                      key={item.id}
                      className="group bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300"
                    >
                      {/* Image Container */}
                      <div className="relative h-48 bg-gray-100 overflow-hidden">
                        {/* Checkbox */}
                        <div className="absolute top-3 left-3 z-10">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(item.productId)}
                            onChange={() => handleToggleItem(item.productId)}
                            className="w-5 h-5 rounded cursor-pointer accent-blue-600"
                          />
                        </div>

                        <img
                          src={getFirstImageUrl(item.product.images) || '/placeholder.png'}
                          alt={item.product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {item.product.stock <= 0 && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 flex flex-col h-full">
                        <Link href={`/products/${item.product.slug}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-red-600 line-clamp-2 text-sm transition">
                            {item.product.name}
                          </h3>
                        </Link>

                        {/* Rating */}
                        <div className="flex items-center gap-1.5 mt-2 mb-2">
                          <div className="flex gap-0">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-xs ${
                                  i < Math.floor(item.product.rating || 0)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <span className="text-xs text-gray-600 font-medium">
                            {item.product.rating?.toFixed(1) || '0'}
                          </span>
                          <span className="text-xs text-gray-500">({item.product.reviews || 0})</span>
                        </div>

                        {/* Stock Badge */}
                        <div className={`inline-block px-2 py-1 rounded-md text-xs font-semibold mb-3 w-fit ${
                          item.product.stock > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {item.product.stock > 0 ? `In Stock (${item.product.stock})` : 'Out'}
                        </div>

                        {/* Price */}
                        <p className="text-lg font-bold text-red-600 mt-auto mb-3">
                          IDR {item.product.price?.toLocaleString('id-ID') || '0'}
                        </p>

                        {/* Action Buttons */}
                        <div className="space-y-2">
                          <Button
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white h-9 text-sm"
                            disabled={item.product.stock <= 0}
                            onClick={() => {
                              try {
                                const existingCart = localStorage.getItem('cart');
                                let cartData = [];
                                if (existingCart) {
                                  cartData = JSON.parse(existingCart);
                                }
                                cartData.push({
                                  productId: item.productId,
                                  quantity: 1,
                                  price: item.product.price,
                                });
                                localStorage.setItem('cart', JSON.stringify(cartData));
                                toast.success('Added to cart');
                              } catch (error) {
                                toast.error('Failed to add to cart');
                              }
                            }}
                          >
                            <ShoppingCart size={14} className="mr-1" /> Add
                          </Button>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 text-xs"
                              asChild
                            >
                              <Link href={`/products/${item.product.slug}`}>
                                <Eye size={14} />
                              </Link>
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              className="flex-1 h-8 text-xs"
                              onClick={() => removeFromWishlistMutation.mutate(item.productId)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* List View */}
              {viewMode === 'list' && (
                <div className="space-y-3">
                  {wishlistData?.map((item: any) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 transition-all p-4"
                    >
                      <div className="flex gap-4 items-start">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.productId)}
                          onChange={() => handleToggleItem(item.productId)}
                          className="w-5 h-5 rounded mt-1 cursor-pointer accent-blue-600 flex-shrink-0"
                        />

                        {/* Image */}
                        <div className="relative w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                          <img
                            src={getFirstImageUrl(item.product.images) || '/placeholder.png'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <Link href={`/products/${item.product.slug}`}>
                            <h3 className="font-semibold text-gray-900 hover:text-red-600 line-clamp-2 text-sm transition">
                              {item.product.name}
                            </h3>
                          </Link>
                          
                          <div className="flex items-center gap-2 text-xs mt-1.5 mb-1">
                            <div className="flex gap-0">
                              {[...Array(5)].map((_, i) => (
                                <span
                                  key={i}
                                  className={`${
                                    i < Math.floor(item.product.rating || 0)
                                      ? 'text-yellow-400'
                                      : 'text-gray-300'
                                  }`}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                            <span className="font-medium text-gray-600">{item.product.rating?.toFixed(1) || '0'}</span>
                            <span className="text-gray-500">({item.product.reviews || 0})</span>
                          </div>

                          <p className="text-sm text-gray-600 mb-1">{item.product.category?.name}</p>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <p className="font-bold text-red-600 text-sm">
                              IDR {item.product.price?.toLocaleString('id-ID') || '0'}
                            </p>
                            <div className={`px-2 py-1 rounded text-xs font-semibold ${
                              item.product.stock > 0
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {item.product.stock > 0 ? `In Stock (${item.product.stock})` : 'Out'}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <Link href={`/products/${item.product.slug}`}>
                            <Button variant="outline" size="sm" className="w-24 h-8 text-xs">
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            className="w-24 bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                            disabled={item.product.stock <= 0}
                            onClick={() => {
                              try {
                                const existingCart = localStorage.getItem('cart');
                                let cartData = [];
                                if (existingCart) {
                                  cartData = JSON.parse(existingCart);
                                }
                                cartData.push({
                                  productId: item.productId,
                                  quantity: 1,
                                  price: item.product.price,
                                });
                                localStorage.setItem('cart', JSON.stringify(cartData));
                                toast.success('Added to cart');
                              } catch (error) {
                                toast.error('Failed to add to cart');
                              }
                            }}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="w-24 h-8 text-xs"
                            onClick={() => removeFromWishlistMutation.mutate(item.productId)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
          </>
        ) : (
          <div className="bg-white rounded-2xl border-2 border-dashed border-red-200 shadow-sm p-16 text-center">
            <div className="flex flex-col items-center">
              <div className="p-4 bg-red-50 rounded-full mb-6">
                <Heart size={64} className="text-red-400 fill-red-200" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
              <p className="text-gray-600 mb-8 max-w-md">Start adding items to your wishlist to keep track of your favorite products</p>
              <Link href="/products">
                <Button className="bg-red-600 hover:bg-red-700 text-white h-11 px-8">
                  <ShoppingCart size={18} className="mr-2" /> Browse Products
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
}
