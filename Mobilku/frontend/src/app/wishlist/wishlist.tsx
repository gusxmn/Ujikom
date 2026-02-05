'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Card, CardContent } from '@/lib/components/ui/Card';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Eye,
  Share2,
  Package,
  AlertCircle,
  Filter,
  SortAsc,
  SortDesc,
  ArrowRight,
  Check,
  X
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sortBy, setSortBy] = useState('recent');
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Fetch wishlist
  const { data: wishlist, isLoading, refetch } = useQuery({
    queryKey: ['wishlist', sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sortBy !== 'recent') {
        params.append('sort', sortBy);
      }
      const response = await api.get(`/wishlist?${params}`);
      return response.data;
    },
    enabled: !!user,
  });

  // Remove item mutation
  const removeItemMutation = useMutation({
    mutationFn: (itemId: number) => api.delete(`/wishlist/items/${itemId}`),
    onSuccess: () => {
      toast.success('Item removed from wishlist');
      refetch();
      setSelectedItems([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (productId: number) =>
      api.post('/cart/items', { productId, quantity: 1 }),
    onSuccess: () => {
      toast.success('Added to cart successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    },
  });

  // Bulk remove mutation
  const bulkRemoveMutation = useMutation({
    mutationFn: (itemIds: number[]) =>
      api.post('/wishlist/bulk-remove', { itemIds }),
    onSuccess: () => {
      toast.success('Selected items removed from wishlist');
      setSelectedItems([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove items');
    },
  });

  // Move to cart mutation
  const moveToCartMutation = useMutation({
    mutationFn: async (itemIds: number[]) => {
      // First add to cart
      await Promise.all(
        itemIds.map(itemId => 
          api.post('/cart/items', { productId: itemId, quantity: 1 })
        )
      );
      // Then remove from wishlist
      await api.post('/wishlist/bulk-remove', { itemIds });
    },
    onSuccess: () => {
      toast.success('Items moved to cart!');
      setSelectedItems([]);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to move items');
    },
  });

  const handleSelectAll = () => {
    if (selectedItems.length === wishlist?.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(wishlist?.map((item: any) => item.id) || []);
    }
  };

  const handleSelectItem = (itemId: number) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleBulkRemove = () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }
    
    if (confirm(`Remove ${selectedItems.length} item(s) from wishlist?`)) {
      bulkRemoveMutation.mutate(selectedItems);
    }
  };

  const handleMoveToCart = () => {
    if (selectedItems.length === 0) {
      toast.error('No items selected');
      return;
    }
    
    moveToCartMutation.mutate(selectedItems);
  };

  const handleShareWishlist = () => {
    if (!user) return;
    
    const wishlistUrl = `${window.location.origin}/wishlist/shared/${user.id}`;
    if (navigator.share) {
      navigator.share({
        title: 'My Wishlist',
        text: 'Check out my wishlist!',
        url: wishlistUrl,
      });
    } else {
      navigator.clipboard.writeText(wishlistUrl);
      toast.success('Wishlist link copied to clipboard!');
    }
  };

  const sortedWishlist = [...(wishlist || [])].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        return a.product.price - b.product.price;
      case 'price_high':
        return b.product.price - a.product.price;
      case 'name':
        return a.product.name.localeCompare(b.product.name);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Please Login</h2>
            <p className="text-gray-600 mb-6">
              You need to be logged in to view your wishlist
            </p>
            <div className="flex gap-3">
              <Link href="/login" className="flex-1">
                <Button variant="primary" fullWidth>Login</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button variant="outline" fullWidth>Register</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-80 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
              <p className="text-gray-600 mt-2">
                {wishlist?.length || 0} item(s) saved for later
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                className="gap-2"
                onClick={handleShareWishlist}
              >
                <Share2 className="w-4 h-4" />
                Share Wishlist
              </Button>
            </div>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedItems.length > 0 && (
          <Card className="mb-6 border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-primary" />
                  <span className="font-medium text-primary">
                    {selectedItems.length} item(s) selected
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={handleMoveToCart}
                    disabled={moveToCartMutation.isPending}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Move to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={handleBulkRemove}
                    disabled={bulkRemoveMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    Remove Selected
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItems([])}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters and Sort */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedItems.length === wishlist?.length && wishlist.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Select All</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border-0 bg-transparent text-sm font-medium focus:outline-none focus:ring-0"
              >
                <option value="recent">Most Recent</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Wishlist Items */}
        {sortedWishlist.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedWishlist.map((item: any) => {
              const product = item.product;
              const isSelected = selectedItems.includes(item.id);
              const isOutOfStock = product.stock === 0;
              
              return (
                <Card
                  key={item.id}
                  className={`overflow-hidden hover:shadow-lg transition-all group ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${isOutOfStock ? 'opacity-60' : ''}`}
                >
                  <CardContent className="p-4">
                    {/* Selection Checkbox */}
                    <div className="absolute top-4 left-4 z-10">
                      <button
                        onClick={() => handleSelectItem(item.id)}
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                          isSelected
                            ? 'bg-primary border-primary'
                            : 'bg-white border-gray-300 hover:border-primary'
                        }`}
                      >
                        {isSelected && (
                          <Check className="w-3 h-3 text-white" />
                        )}
                      </button>
                    </div>

                    {/* Product Image */}
                    <div className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
                      <Link href={`/products/${product.slug}`}>
                        <div className="w-full h-full">
                          {product.images?.[0] ? (
                            <Image
                              src={product.images[0]}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <Package className="w-16 h-16" />
                            </div>
                          )}
                        </div>
                      </Link>
                      
                      {/* Out of Stock Badge */}
                      {isOutOfStock && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded">
                            Out of Stock
                          </span>
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-8 h-8 p-0 bg-white rounded-full shadow-md"
                          onClick={() => removeItemMutation.mutate(item.id)}
                          disabled={removeItemMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Link href={`/products/${product.slug}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-8 h-8 p-0 bg-white rounded-full shadow-md"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="space-y-2">
                      <Link href={`/products/${product.slug}`}>
                        <h3 className="font-medium text-gray-900 line-clamp-2 hover:text-primary transition-colors">
                          {product.name}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {formatPrice(Number(product.price))}
                        </span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(Number(product.originalPrice))}
                          </span>
                        )}
                      </div>
                      
                      {product.category && (
                        <p className="text-xs text-gray-500">
                          {product.category.name}
                        </p>
                      )}

                      {product.stock > 0 && product.stock < 10 && (
                        <div className="flex items-center gap-1 text-amber-600 text-sm">
                          <AlertCircle className="w-4 h-4" />
                          <span>Only {product.stock} left in stock</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        asChild
                      >
                        <Link href={`/products/${product.slug}`}>
                          <Eye className="w-4 h-4" />
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="primary"
                        className="flex-1 gap-2"
                        onClick={() => addToCartMutation.mutate(product.id)}
                        disabled={isOutOfStock || addToCartMutation.isPending}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <Heart className="w-16 h-16 text-gray-300 mx-auto mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Your Wishlist is Empty
              </h3>
              <p className="text-gray-600 mb-6">
                Save items you love for later. Start adding products to your wishlist!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/products">
                  <Button variant="primary" className="gap-2">
                    <ArrowRight className="w-5 h-5" />
                    Browse Products
                  </Button>
                </Link>
                <Link href="/products?sort=bestsellers">
                  <Button variant="outline">View Best Sellers</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recommendations Section */}
        {sortedWishlist.length > 0 && sortedWishlist.length < 4 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gray-100 rounded-lg mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}