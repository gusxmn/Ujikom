'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { AlertCircle, CheckCircle2, Star, User, Heart, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface Review {
  id: number;
  productId: number;
  userId: number;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  slug: string;
  year: number;
  transmission: string;
  fuelType: string;
  mileage: number;
  color: string;
  stock: number;
  rating: number;
  reviews?: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  images: string | any[]; // Can be JSON string or array
  isActive: boolean;
  createdAt: string;
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const fromAdmin = searchParams.get('from') === 'admin';

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewsLoading, setIsReviewsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isBuyLoading, setIsBuyLoading] = useState(false);
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isWishlistLoading, setIsWishlistLoading] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await api.get(`/products/slug/${slug}`);
        setProduct(response.data);
        setIsLoading(false);
        
        // Fetch reviews for this product
        if (response.data.id) {
          fetchReviews(response.data.id);
          checkWishlistStatus(response.data.id);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        router.push('/products');
      }
    };

    fetchProduct();
  }, [slug, router]);

  const fetchReviews = async (productId: number) => {
    try {
      setIsReviewsLoading(true);
      const response = await api.get(`/reviews/product/${productId}`);
      // Handle both direct array and object with reviews property
      const reviewsData = Array.isArray(response.data) ? response.data : response.data?.reviews || [];
      setReviews(reviewsData);
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
      setReviews([]);
    } finally {
      setIsReviewsLoading(false);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const checkWishlistStatus = async (productId: number) => {
    try {
      const response = await api.get(`/wishlist/check/${productId}`);
      setIsInWishlist(response.data.isInWishlist);
    } catch (error) {
      console.error('Failed to check wishlist status:', error);
    }
  };

  const toggleWishlist = async () => {
    if (!product) return;
    
    setIsWishlistLoading(true);
    try {
      if (isInWishlist) {
        await api.delete(`/wishlist/remove/${product.id}`);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post(`/wishlist/add`, { productId: product.id });
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error);
      toast.error('Failed to update wishlist');
    } finally {
      setIsWishlistLoading(false);
    }
  };

  const handleBuy = async () => {
    if (!product) return;
    
    setIsBuyLoading(true);
    try {
      // Get or create cart from localStorage
      const existingCart = localStorage.getItem('cart');
      let cartData = [];
      
      if (existingCart) {
        try {
          cartData = JSON.parse(existingCart);
        } catch (e) {
          console.error('Failed to parse cart:', e);
          cartData = [];
        }
      }
      
      // Add product to cart
      cartData.push({
        productId: product.id,
        quantity: quantity,
        price: product.price,
      });
      
      // Save cart to localStorage
      localStorage.setItem('cart', JSON.stringify(cartData));
      
      toast.success(`${quantity} unit(s) added to cart`);
      
      // Redirect to checkout immediately
      router.push('/checkout');
    } catch (error) {
      console.error('Failed to add to cart:', error);
      toast.error('Failed to add to cart');
      setIsBuyLoading(false);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <p className="text-slate-600 text-center">Product not found</p>
        </div>
      </div>
    );
  }

  // Parse images from JSON (images are stored as JSON string with { filename, url } objects)
  let images: string[] = [];
  try {
    if (typeof product.images === 'string') {
      const parsed = JSON.parse(product.images);
      images = Array.isArray(parsed) ? parsed.map((img: any) => img.url || img) : [];
    } else if (Array.isArray(product.images)) {
      images = product.images.map((img: any) => typeof img === 'string' ? img : img.url);
    }
  } catch (e) {
    console.error('Failed to parse images:', e);
  }
  
  const displayImage = images.length > 0 ? images[selectedImage] : '/placeholder-car.png';

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              if (fromAdmin) {
                router.push('/admin/products');
              } else {
                router.back();
              }
            }}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Images Section */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-6">
                {/* Main Image */}
                <div className="w-full bg-slate-100 rounded-lg overflow-hidden mb-4 flex items-center justify-center min-h-96">
                  <img
                    src={displayImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Thumbnail Images */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {images.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                          selectedImage === index
                            ? 'border-blue-500'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img src={image} alt={`${product.name} ${index}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Product Info Section */}
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <span className="flex items-center gap-1 text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-4 h-4" />
                  In Stock
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full">
                  <AlertCircle className="w-4 h-4" />
                  Out of Stock
                </span>
              )}
            </div>

            {/* Price */}
            <div>
              <p className="text-slate-600 text-sm">Price</p>
              <p className="text-4xl font-bold text-slate-900">IDR {product.price.toLocaleString('id-ID')}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                <span className="text-lg font-semibold text-slate-900">{product.rating?.toFixed(1) || '0'}</span>
                <span className="text-sm text-slate-500">({reviews.length} reviews)</span>
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <p className="text-slate-600 text-sm mb-2">Quantity</p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border border-slate-300 rounded hover:border-slate-800 transition text-slate-800 font-bold"
                >
                  −
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 text-center border border-slate-300 rounded py-2 text-slate-800 font-bold"
                  min="1"
                  max={product.stock}
                />
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="w-10 h-10 border border-slate-300 rounded hover:border-slate-800 transition text-slate-800 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={handleBuy}
              disabled={product.stock === 0 || isBuyLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition"
            >
              {isBuyLoading ? 'Loading...' : product.stock > 0 ? 'Beli Sekarang' : 'Out of Stock'}
            </button>

            {/* Wishlist Button */}
            <button
              onClick={toggleWishlist}
              disabled={isWishlistLoading}
              className="w-full border-2 border-slate-300 hover:border-red-600 text-slate-900 hover:text-red-600 font-semibold py-3 rounded-lg transition flex items-center justify-center gap-2 mt-3"
            >
              <Heart
                size={20}
                className={isInWishlist ? 'fill-red-600 text-red-600' : ''}
              />
              {isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>
          </div>
        </div>

        {/* Product Description */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
                  <p className="text-slate-600 leading-relaxed">
                    {product.description || 'No description available'}
                  </p>
                </div>

                {/* Specifications */}
                <div className="pt-4 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-4">Specifications</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Year</span>
                      <span className="font-medium text-slate-900">{product.year}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Transmission</span>
                      <span className="font-medium text-slate-900">{product.transmission}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Fuel Type</span>
                      <span className="font-medium text-slate-900">{product.fuelType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Mileage</span>
                      <span className="font-medium text-slate-900">{product.mileage.toLocaleString('id-ID')} KM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Color</span>
                      <span className="font-medium text-slate-900">{product.color}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Stock</span>
                      <span className={`font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {product.stock} unit{product.stock !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                Customer Reviews ({reviews.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isReviewsLoading ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600">No reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border-b border-slate-200 pb-4 last:border-b-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{review.user.name}</p>
                              <p className="text-xs text-slate-500">
                                {new Date(review.createdAt).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="mb-2">
                            {renderStars(review.rating)}
                          </div>
                          <p className="text-slate-700">{review.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
