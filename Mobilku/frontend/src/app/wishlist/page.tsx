'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent } from '@/lib/components/ui/Card';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Eye,
  Share2,
  LayoutGrid,
  List,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Link from 'next/link';

type SortOption = 'recent' | 'price-low' | 'price-high' | 'name';
type ViewMode = 'grid' | 'list';

export default function WishlistPage() {
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Fetch wishlist
  const { data: wishlist, isLoading, refetch } = useQuery({
    queryKey: ['wishlist', sortBy],
    queryFn: async () => {
      const response = await api.get(`/wishlist?sort=${sortBy}`);
      return response.data?.items || [];
    },
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
      await api.delete(`/wishlist/${productId}`);
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
    if (selectedItems.length === wishlist?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlist?.map((item: any) => item.id) || []);
    }
  };

  // Toggle item selection
  const handleToggleItem = (id: number) => {
    setSelectedItems(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Share wishlist
  const handleShareWishlist = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Wishlist link copied to clipboard');
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart size={32} className="text-red-600" /> My Wishlist
            </h1>
            <p className="text-gray-600 mt-2">
              {wishlist?.length || 0} item{wishlist?.length !== 1 ? 's' : ''} in your wishlist
            </p>
          </div>
          <Button variant="outline" onClick={handleShareWishlist} className="flex items-center gap-2">
            <Share2 size={18} /> Share
          </Button>
        </div>

        {wishlist && wishlist.length > 0 ? (
          <>
            {/* Toolbar */}
            <div className="bg-white p-4 rounded-lg mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
              {/* Bulk Actions */}
              <div className="flex gap-2">
                <input
                  type="checkbox"
                  checked={selectedItems.length === wishlist.length && wishlist.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4"
                  title="Select all"
                />
                {selectedItems.length > 0 && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleAddSelectedToCart}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart size={16} /> Add {selectedItems.length} to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleRemoveSelected}
                      className="flex items-center gap-2"
                    >
                      <Trash2 size={16} /> Remove {selectedItems.length}
                    </Button>
                  </>
                )}
              </div>

              {/* Sort and View */}
              <div className="flex gap-4 items-center">
                <select
                  value={sortBy}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSortBy(e.target.value as SortOption)}
                  className="px-4 py-2 border border-gray-300 rounded-lg bg-white"
                >
                  <option value="recent">Recent</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="name">Name</option>
                </select>

                <div className="flex gap-2 border border-gray-300 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-gray-200' : ''}`}
                    title="Grid view"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-gray-200' : ''}`}
                    title="List view"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {wishlist.map((item: any) => (
                  <Card key={item.id} className="overflow-hidden hover:shadow-lg transition">
                    <CardContent className="p-0">
                      {/* Checkbox */}
                      <div className="absolute top-2 left-2 z-10">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleToggleItem(item.id)}
                          className="w-5 h-5 rounded border-gray-300"
                        />
                      </div>

                      {/* Image */}
                      <div className="relative h-48 bg-gray-100">
                        <Image
                          src={item.image || '/placeholder.png'}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        {!item.inStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <p className="text-white font-semibold">Out of Stock</p>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-4">
                        <Link href={`/products/${item.slug}`}>
                          <h3 className="font-semibold text-gray-900 hover:text-blue-600 line-clamp-2">
                            {item.name}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-blue-600 mt-2">
                          {formatPrice(item.price)}
                        </p>

                        {/* Actions */}
                        <div className="flex gap-2 mt-4">
                          <Link href={`/products/${item.slug}`} className="flex-1">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full flex items-center justify-center gap-1"
                            >
                              <Eye size={16} /> View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromWishlistMutation.mutate(item.id)}
                            className="flex-1 flex items-center justify-center gap-1"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>

                        {/* Add to Cart */}
                        <Button
                          fullWidth
                          className="mt-3 flex items-center justify-center gap-2"
                          disabled={!item.inStock}
                          onClick={() => addToCartMutation.mutate(item.id)}
                        >
                          <ShoppingCart size={16} /> Add to Cart
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-4">
                {wishlist.map((item: any) => (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleToggleItem(item.id)}
                          className="w-5 h-5 rounded border-gray-300 mt-1"
                        />

                        {/* Image */}
                        <div className="relative w-24 h-24 bg-gray-100 rounded flex-shrink-0">
                          <Image
                            src={item.image || '/placeholder.png'}
                            alt={item.name}
                            fill
                            className="object-cover rounded"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1">
                          <Link href={`/products/${item.slug}`}>
                            <h3 className="font-semibold text-gray-900 hover:text-blue-600">
                              {item.name}
                            </h3>
                          </Link>
                          <p className="text-gray-600 text-sm mt-1">{item.category}</p>
                          <p className="text-lg font-bold text-blue-600 mt-2">
                            {formatPrice(item.price)}
                          </p>
                          <div className={`text-sm mt-1 ${item.inStock ? 'text-green-600' : 'text-red-600'}`}>
                            {item.inStock ? '✓ In Stock' : '✗ Out of Stock'}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                          <Link href={`/products/${item.slug}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button
                            size="sm"
                            disabled={!item.inStock}
                            onClick={() => addToCartMutation.mutate(item.id)}
                            className="flex items-center justify-center gap-1"
                          >
                            <ShoppingCart size={14} /> Cart
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => removeFromWishlistMutation.mutate(item.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg mb-4">Your wishlist is empty</p>
              <p className="text-gray-500 mb-6">Add items to your wishlist to save them for later</p>
              <Link href="/products">
                <Button>Start Shopping</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
