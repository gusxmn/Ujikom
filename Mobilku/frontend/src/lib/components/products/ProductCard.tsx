import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Star, ShoppingCart, Heart } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { buildImageUrl } from '@/lib/utils';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
}

export default function ProductCard({
  id,
  name,
  slug,
  price,
  image,
  rating = 0,
  reviews = 0,
  stock = 0,
}: ProductCardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Build proper image URL with backend base URL if needed
  const imageUrl = image ? buildImageUrl(image) : null;

  const handleAddToCart = async () => {
    setIsLoading(true);
    try {
      await api.post('/cart/add', { 
        productId: parseInt(id, 10),
        quantity: 1 
      });
      toast.success('Added to cart!');
      // Refresh cart query
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add to cart';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    try {
      // Add to wishlist via API
      await api.post('/wishlist/add', { productId: parseInt(id, 10) });
      toast.success('Added to wishlist!');
      // Invalidate wishlist query to refetch
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to add to wishlist';
      toast.error(errorMessage);
    }
  };

  return (
    <Link href={`/products/${slug}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition group cursor-pointer">
        {/* Product Image */}
        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
          {imageUrl && !imageError ? (
            <img
              src={imageUrl}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition"
              onError={() => {
                console.error('Failed to load image:', imageUrl);
                setImageError(true);
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', imageUrl);
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-300">
              <span className="text-gray-500">No image</span>
            </div>
          )}
          {stock === 0 && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <span className="text-white font-semibold">Out of Stock</span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 truncate">{name}</h3>

          {/* Rating */}
          {rating > 0 && (
            <div className="flex items-center mt-2">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${i < Math.round(rating) ? 'fill-current' : ''}`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600 ml-2">({reviews})</span>
            </div>
          )}

          {/* Price */}
          <p className="text-lg font-bold text-blue-600 mt-2">
            Rp {price.toLocaleString('id-ID')}
          </p>

          {/* Stock Status */}
          <p className="text-xs text-gray-500 mt-1">
            {stock > 0 ? `${stock} in stock` : 'Out of stock'}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToCart();
              }}
              disabled={stock === 0 || isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 rounded flex items-center justify-center gap-2 transition"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="text-sm">Add</span>
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                handleAddToWishlist();
              }}
              className="flex-1 border border-gray-300 hover:border-red-500 text-gray-600 hover:text-red-500 py-2 rounded flex items-center justify-center transition"
            >
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
