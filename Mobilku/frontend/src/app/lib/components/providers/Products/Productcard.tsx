'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatPrice } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    slug: string;
    price: any;
    images: string[];
    year: number;
    transmission: string;
    fuelType: string;
    mileage: number;
    stock: number;
  };
  showActions?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  showActions = true 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: (quantity: number) =>
      api.post('/cart/add', { productId: product.id, quantity }),
    onSuccess: () => {
      toast.success('Added to cart!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    },
  });

  // Add to wishlist mutation
  const addToWishlistMutation = useMutation({
    mutationFn: () =>
      api.post('/wishlist/add', { productId: product.id }),
    onSuccess: () => {
      toast.success('Added to wishlist!');
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add to wishlist');
    },
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      return;
    }
    addToCartMutation.mutate(1);
  };

  const handleAddToWishlist = () => {
    if (!user) {
      toast.error('Please login to add items to wishlist');
      return;
    }
    addToWishlistMutation.mutate();
  };

  const mainImage = product.images?.[0] || '/placeholder-car.jpg';

  return (
    <div
      className="group bg-white rounded-xl shadow-md border overflow-hidden hover:shadow-lg transition-shadow"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Section */}
      <div className="relative h-48 md:h-56 overflow-hidden bg-gray-100">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
        
        {/* Stock badge */}
        {product.stock <= 3 && product.stock > 0 && (
          <div className="absolute top-3 left-3 bg-amber-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Low Stock: {product.stock}
          </div>
        )}
        {product.stock === 0 && (
          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
            Out of Stock
          </div>
        )}
        
        {/* Quick actions on hover */}
        {isHovered && showActions && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 transition-opacity">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddToWishlist}
              disabled={addToWishlistMutation.isPending}
              className="bg-white hover:bg-white/90"
            >
              <Heart className="h-4 w-4" />
            </Button>
            <Link href={`/products/${product.slug}`}>
              <Button
                variant="ghost"
                size="sm"
                className="bg-white hover:bg-white/90"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCartMutation.isPending}
              isLoading={addToCartMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-blue-600 transition">
            {product.name}
          </h3>
        </Link>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-2xl font-bold text-blue-600">
            {formatPrice(Number(product.price))}
          </span>
          <span className="text-sm text-gray-500">{product.year}</span>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <span className="font-medium">Transmission:</span>
            <span className="capitalize">{product.transmission.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">Fuel:</span>
            <span className="capitalize">{product.fuelType.toLowerCase()}</span>
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <span className="font-medium">Mileage:</span>
            <span>{product.mileage.toLocaleString()} km</span>
          </div>
        </div>

        {/* Action buttons */}
        {showActions && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              fullWidth
              onClick={handleAddToWishlist}
              disabled={addToWishlistMutation.isPending}
              isLoading={addToWishlistMutation.isPending}
            >
              <Heart className="h-4 w-4 mr-2" />
              Wishlist
            </Button>
            <Button
              variant="primary"
              fullWidth
              onClick={handleAddToCart}
              disabled={product.stock === 0 || addToCartMutation.isPending}
              isLoading={addToCartMutation.isPending}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Add to Cart
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;