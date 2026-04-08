'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import { ArrowLeft, Save, Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ProductData {
  name: string;
  description: string;
  sku?: string;
  price: number;
  categoryId: number;
  stock: number;
  year: number;
  transmission: string;
  fuelType: string;
  mileage: number;
  color: string;
}

interface ProductFormProps {
  productId?: number;
  mode: 'create' | 'edit';
}

export default function ProductForm({ productId, mode }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [formData, setFormData] = useState<ProductData>({
    name: '',
    description: '',
    sku: '',
    price: 0,
    categoryId: 0,
    stock: 0,
    year: new Date().getFullYear(),
    transmission: 'AUTOMATIC',
    fuelType: 'GASOLINE',
    mileage: 0,
    color: '',
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
        if (response.data.length > 0 && mode === 'create') {
          setFormData(prev => ({ ...prev, categoryId: response.data[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        toast.error('Failed to load categories');
      }
    };
    fetchCategories();
  }, [mode]);

  // Fetch product data if editing
  useEffect(() => {
    if (mode === 'edit' && productId) {
      const fetchProduct = async () => {
        try {
          const response = await api.get(`/products/${productId}`);
          const product = response.data;
          setFormData({
            name: product.name,
            description: product.description || '',
            sku: product.sku || '',
            price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
            categoryId: product.categoryId,
            stock: product.stock,
            year: product.year,
            transmission: product.transmission,
            fuelType: product.fuelType,
            mileage: product.mileage || 0,
            color: product.color,
          });
          
          // Load images if they exist
          if (product.images && Array.isArray(product.images)) {
            setImages(product.images);
          }
        } catch (error) {
          console.error('Failed to fetch product:', error);
          toast.error('Product not found');
          router.push('/admin/products');
        }
      };
      fetchProduct();
    }
  }, [mode, productId, router]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setIsUploadingImage(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formDataImage = new FormData();
        formDataImage.append('file', file);

        const response = await api.post('/upload', formDataImage, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data?.url) {
          setImages(prev => [...prev, response.data.url]);
        }
      }
      toast.success('Image uploaded successfully');
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Failed to upload image');
    } finally {
      setIsUploadingImage(false);
      // Reset input
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return;
    }

    if (formData.categoryId === 0) {
      toast.error('Please select a category');
      return;
    }

    if (isNaN(formData.price) || formData.price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (isNaN(formData.stock) || formData.stock < 0) {
      toast.error('Stock must be 0 or greater');
      return;
    }

    if (isNaN(formData.year) || formData.year < 1900) {
      toast.error('Please enter a valid year');
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price.toString()),
        categoryId: parseInt(formData.categoryId.toString()),
        stock: parseInt(formData.stock.toString()),
        year: parseInt(formData.year.toString()),
        transmission: formData.transmission,
        fuelType: formData.fuelType,
        mileage: parseInt(formData.mileage.toString()),
        color: formData.color.trim(),
        images: images.length > 0 ? images : undefined,
      };

      if (mode === 'create') {
        await api.post('/products', submitData);
        toast.success('Product created successfully');
      } else {
        await api.patch(`/products/${productId}`, submitData);
        toast.success('Product updated successfully');
      }
      router.push('/admin/products');
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: any = value;
    
    if (type === 'number') {
      processedValue = value === '' ? 0 : parseFloat(value);
    } else if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'categoryId' || name === 'year' || name === 'stock' || name === 'mileage') {
      // Convert these fields to numbers for select fields
      processedValue = value === '' ? 0 : parseInt(value, 10);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            {mode === 'create' ? 'Add New Product' : 'Edit Product'}
          </h1>
          <p className="text-slate-600 mt-1">
            {mode === 'create' 
              ? 'Create a new product in your store' 
              : 'Update product information'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Product Name *
              </label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter product description"
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900 placeholder-gray-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                SKU (Stock Keeping Unit)
              </label>
              <Input
                name="sku"
                value={formData.sku || ''}
                onChange={handleInputChange}
                placeholder="e.g., SKU-TOYOTA-AVANZA-001"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category *
                </label>
                <select
                  name="categoryId"
                  value={formData.categoryId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                  required
                >
                  <option value={0}>Select a category</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Price (IDR) *
                </label>
                <Input
                  type="number"
                  name="price"
                  value={formData.price === 0 ? '' : formData.price.toString()}
                  onChange={handleInputChange}
                  placeholder="Enter price"
                  min="1"
                  step="1"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-8">
              <label className="flex flex-col items-center justify-center gap-2 cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  Click to upload images or drag and drop
                </span>
                <span className="text-xs text-slate-500">
                  Supported formats: JPG, PNG, WebP
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </label>
              {isUploadingImage && (
                <div className="mt-4 flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-slate-600">Uploading...</span>
                </div>
              )}
            </div>

            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square rounded-lg overflow-hidden bg-slate-100">
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="text-center mt-1 text-xs text-slate-500">
                      Image {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {images.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-500">
                <ImageIcon className="w-8 h-8" />
                <span className="text-sm">No images uploaded yet</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicle Information */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Year *
                </label>
                <Input
                  type="number"
                  name="year"
                  value={formData.year.toString()}
                  onChange={handleInputChange}
                  min="1990"
                  max={new Date().getFullYear().toString()}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Transmission *
                </label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                  required
                >
                  <option value="MANUAL">Manual</option>
                  <option value="AUTOMATIC">Automatic</option>
                  <option value="SEMI_AUTOMATIC">Semi Automatic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Fuel Type *
                </label>
                <select
                  name="fuelType"
                  value={formData.fuelType}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-slate-900"
                  required
                >
                  <option value="GASOLINE">Petrol (Gasoline)</option>
                  <option value="DIESEL">Diesel</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ELECTRIC">Electric</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Mileage (KM)
                </label>
                <Input
                  type="number"
                  name="mileage"
                  value={formData.mileage.toString()}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Color
                </label>
                <Input
                  name="color"
                  value={formData.color}
                  onChange={handleInputChange}
                  placeholder="e.g., Red, Blue, Black"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Stock Quantity *
                </label>
                <Input
                  type="number"
                  name="stock"
                  value={formData.stock.toString()}
                  onChange={handleInputChange}
                  placeholder="0"
                  min="0"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link href="/admin/products">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            <Save className="w-4 h-4" />
            {mode === 'create' ? 'Create Product' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}
