'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent } from '@/lib/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/components/ui/Tabs';
import { 
  ShoppingCart,
  Heart,
  Share2,
  Truck,
  Shield,
  RotateCcw,
  Star,
  StarHalf,
  ChevronLeft,
  Package,
  Check,
  Minus,
  Plus,
  ArrowRight
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Image from 'next/image';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Fetch product details
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', params.slug],
    queryFn: async () => {
      const response = await api.get(`/products/${params.slug}`);
      return response.data;
    },
  });

  // Fetch related products
  const { data: relatedProducts } = useQuery({
    queryKey: ['related-products', product?.id],
    queryFn: async () => {
      if (!product) return [];
      const response = await api.get(`/products/related/${product.id}`);
      return response.data;
    },
    enabled: !!product,
  });

  // Check if product is in wishlist
  useEffect(() => {
    if (user && product) {
      api.get(`/wishlist/check/${product.id}`)
        .then(res => setIsWishlisted(res.data.isWishlisted))
        .catch(() => setIsWishlisted(false));
    }
  }, [user, product]);

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart');
      router.push('/login');
      return;
    }

    try {
      await api.post('/cart/items', {
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity: quantity
      });
      toast.success('Added to cart successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      toast.error('Please login to continue');
      router.push('/login');
      return;
    }

    try {
      await api.post('/cart/items', {
        productId: product.id,
        variantId: selectedVariant?.id,
        quantity: quantity
      });
      router.push('/checkout');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process');
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to manage wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/items/${product.id}`);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await api.post('/wishlist/items', { productId: product.id });
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const renderRatingStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }

    if (hasHalfStar) {
      stars.push(<StarHalf key="half" className="w-5 h-5 fill-yellow-400 text-yellow-400" />);
    }

    const emptyStars = 5 - stars.length;
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} className="w-5 h-5 text-gray-300" />);
    }

    return stars;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="grid lg:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="h-96 bg-gray-200 rounded-lg"></div>
                <div className="flex gap-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded w-20"></div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-6">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link href="/products">
              <Button variant="primary">
                <ChevronLeft className="w-5 h-5 mr-2" />
                Back to Products
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const mainVariant = product.variants?.[0] || product;
  const currentProduct = selectedVariant || mainVariant;
  const images = currentProduct.images || product.images || [];
  const discountPercentage = product.originalPrice 
    ? Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-8">
          <Link href="/" className="hover:text-primary transition-colors">
            Home
          </Link>
          <ArrowRight className="w-4 h-4" />
          <Link href="/products" className="hover:text-primary transition-colors">
            Products
          </Link>
          <ArrowRight className="w-4 h-4" />
          {product.category && (
            <>
              <Link 
                href={`/products?category=${product.category.slug}`}
                className="hover:text-primary transition-colors"
              >
                {product.category.name}
              </Link>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
          <span className="text-gray-900 font-medium">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column - Images */}
          <div>
            {/* Main Image */}
            <div className="relative aspect-square bg-white rounded-lg border overflow-hidden mb-4">
              {images[selectedImage] ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <Package className="w-32 h-32" />
                </div>
              )}
              
              {/* Discount Badge */}
              {discountPercentage > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{discountPercentage}%
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {images.map((image: string, index: number) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`relative w-20 h-20 rounded-lg border overflow-hidden flex-shrink-0 transition-all ${
                      selectedImage === index 
                        ? 'ring-2 ring-primary ring-offset-2' 
                        : 'hover:opacity-80'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.name} - ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div>
            {/* Product Header */}
            <div className="mb-6">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {product.name}
                  </h1>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center">
                      {renderRatingStars(product.rating || 0)}
                      <span className="ml-2 text-sm text-gray-600">
                        ({product.reviewCount || 0} reviews)
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      SKU: {product.sku || 'N/A'}
                    </span>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleToggleWishlist}
                    className={isWishlisted ? 'text-red-500 hover:text-red-600' : ''}
                  >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mb-6">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-gray-900">
                  {formatPrice(Number(currentProduct.price))}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      {formatPrice(Number(product.originalPrice))}
                    </span>
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                      Save {formatPrice(Number(product.originalPrice) - Number(currentProduct.price))}
                    </span>
                  </>
                )}
              </div>
              
              {/* Tax Info */}
              <p className="text-sm text-gray-500 mt-2">
                Inclusive of all taxes
              </p>
            </div>

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  Select {product.variantType || 'Variant'}:
                </h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((variant: any) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      className={`px-4 py-2 rounded-lg border transition-all ${
                        selectedVariant?.id === variant.id
                          ? 'border-primary bg-primary/5 text-primary font-medium'
                          : 'border-gray-300 hover:border-gray-400'
                      } ${!variant.inStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={!variant.inStock}
                    >
                      {variant.name}
                      {!variant.inStock && ' (Out of Stock)'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Quantity:</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-12 w-12 rounded-r-none"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <Minus className="w-5 h-5" />
                  </Button>
                  <span className="w-16 text-center text-lg font-medium">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-12 w-12 rounded-l-none"
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={quantity >= currentProduct.stock}
                  >
                    <Plus className="w-5 h-5" />
                  </Button>
                </div>
                <span className="text-sm text-gray-500">
                  {currentProduct.stock} units available
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 mb-8">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 gap-2"
                onClick={handleAddToCart}
                disabled={!currentProduct.inStock || currentProduct.stock === 0}
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </Button>
              <Button
                variant="primary"
                size="lg"
                className="flex-1 gap-2"
                onClick={handleBuyNow}
                disabled={!currentProduct.inStock || currentProduct.stock === 0}
              >
                Buy Now
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            {/* Product Features */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Free Shipping</p>
                  <p className="text-xs text-gray-500">Over Rp 1.000.000</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">30-Day Returns</p>
                  <p className="text-xs text-gray-500">Easy return policy</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm font-medium">Secure Payment</p>
                  <p className="text-xs text-gray-500">100% secure</p>
                </div>
              </div>
            </div>

            {/* Product Description */}
            <div className="mb-8">
              <h3 className="font-medium text-gray-900 mb-3">Description</h3>
              <div className="prose max-w-none text-gray-600">
                {product.description}
              </div>
              {product.features && (
                <ul className="mt-4 space-y-2">
                  {product.features.map((feature: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="mb-6">
              <TabsTrigger value="description">Description</TabsTrigger>
              <TabsTrigger value="specifications">Specifications</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({product.reviewCount || 0})</TabsTrigger>
              <TabsTrigger value="shipping">Shipping & Returns</TabsTrigger>
            </TabsList>
            
            <TabsContent value="description">
              <Card>
                <CardContent className="p-6">
                  <div className="prose max-w-none">
                    {product.longDescription || product.description}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="specifications">
              <Card>
                <CardContent className="p-6">
                  {product.specifications ? (
                    <div className="space-y-4">
                      {Object.entries(product.specifications).map(([key, value]) => (
                        <div key={key} className="flex border-b pb-3">
                          <div className="w-1/3 font-medium text-gray-700">{key}</div>
                          <div className="w-2/3 text-gray-600">{value as string}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No specifications available.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No reviews yet
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Be the first to review this product!
                    </p>
                    <Button variant="outline">Write a Review</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="shipping">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Shipping</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li>• Free shipping on orders over Rp 1.000.000</li>
                        <li>• Standard shipping: 3-5 business days</li>
                        <li>• Express shipping: 1-2 business days</li>
                        <li>• International shipping available</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Returns</h4>
                      <ul className="space-y-2 text-gray-600">
                        <li>• 30-day return policy</li>
                        <li>• Items must be in original condition</li>
                        <li>• Free returns for defective items</li>
                        <li>• Refund processed within 5-7 business days</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts && relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {relatedProducts.slice(0, 5).map((relatedProduct: any) => (
                <Link
                  key={relatedProduct.id}
                  href={`/products/${relatedProduct.slug}`}
                  className="group"
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-4">
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                        {relatedProduct.images?.[0] ? (
                          <Image
                            src={relatedProduct.images[0]}
                            alt={relatedProduct.name}
                            width={200}
                            height={200}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-12 h-12" />
                          </div>
                        )}
                      </div>
                      <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                        {relatedProduct.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">
                          {formatPrice(Number(relatedProduct.price))}
                        </span>
                        {relatedProduct.originalPrice && (
                          <span className="text-sm text-gray-500 line-through">
                            {formatPrice(Number(relatedProduct.originalPrice))}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}