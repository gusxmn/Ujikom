'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Button } from '@/lib/components/ui/Button';
import { Input } from '@/lib/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/lib/components/ui/Card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/components/ui/Table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/lib/components/ui/DropdownMenu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/lib/components/ui/Dialog';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Package,
  Check,
  X,
  AlertCircle,
  Download,
  Upload,
  RefreshCw,
  SortAsc,
  SortDesc,
  Loader2,
} from 'lucide-react';
import { formatPrice, formatDate, getFirstImageUrl } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortField, setSortField] = useState('createdAt');
  const [sortDirection, setSortDirection] = useState('desc');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const refreshProducts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleEditProduct = (id: number) => {
    router.push(`/admin/products/${id}/edit`);
  };

  const handleViewProduct = (slug: string) => {
    router.push(`/products/${slug}?from=admin`);
  };

  // Check if user is admin
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'ADMIN')) {
      toast.error('Unauthorized access');
      router.push('/');
    }
  }, [user, authLoading, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get('/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products
  useEffect(() => {
    if (!user || user.role !== 'ADMIN') {
      setIsLoading(false);
      return;
    }

    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        setCurrentPage(1);
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
        params.append('sortBy', sortField);
        params.append('sortOrder', sortDirection);
        params.append('page', '1');
        params.append('limit', '20'); // Changed from 100 to 20 for better performance
        
        const response = await api.get(`/products?${params}`);
        const productsArray = response.data?.data || [];
        const meta = response.data?.meta;
        
        setProducts(productsArray);
        setTotalPages(meta?.totalPages || 0);
        setHasMore(1 < (meta?.totalPages || 0));
      } catch (error) {
        console.error('Failed to fetch products:', error);
        setProducts([]);
        setTotalPages(0);
        setHasMore(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [search, categoryFilter, sortField, sortDirection, user, refreshTrigger]);

  // Load more products
  const handleLoadMore = async () => {
    try {
      setIsLoadingMore(true);
      const nextPage = currentPage + 1;
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'all') params.append('categoryId', categoryFilter);
      params.append('sortBy', sortField);
      params.append('sortOrder', sortDirection);
      params.append('page', nextPage.toString());
      params.append('limit', '20');
      
      const response = await api.get(`/products?${params}`);
      const newProducts = response.data?.data || [];
      const meta = response.data?.meta;
      
      setProducts(prev => [...prev, ...newProducts]);
      setCurrentPage(nextPage);
      setHasMore(nextPage < (meta?.totalPages || 0));
    } catch (error) {
      console.error('Failed to load more products:', error);
      toast.error('Failed to load more products');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (productId: number) => api.delete(`/products/${productId}`),
    onSuccess: () => {
      toast.success('Product deleted successfully');
      refreshProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete product');
    },
  });

  // Bulk delete mutation
  // REMOVED - No longer needed for bulk operations

  // Toggle product status mutation
  const toggleStatusMutation = useMutation({
    mutationFn: ({ productId, status }: { productId: number; status: string }) =>
      api.patch(`/products/${productId}/status`, { status }),
    onSuccess: () => {
      toast.success('Product status updated');
      refreshProducts();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = () => {
    // REMOVED - Selection functionality no longer needed
  };

  const handleSelectProduct = (productId: number) => {
    // REMOVED - Selection functionality no longer needed
  };

  const handleBulkDelete = () => {
    // REMOVED - Bulk delete functionality no longer needed
  };

  const handleExportProducts = () => {
    toast.success('Exporting products data...');
    // Implement export logic
  };

  const handleImportProducts = () => {
    toast.success('Product import feature coming soon!');
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <SortAsc className="w-4 h-4 ml-1" />
    ) : (
      <SortDesc className="w-4 h-4 ml-1" />
    );
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="h-12 bg-gray-200 rounded mb-6"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Link href="/admin/products/new">
              <Button variant="primary" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Search products by name, SKU, or description..."
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filters */}
              <div className="flex gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch('');
                    setCategoryFilter('all');

                  }}
                  className="gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset
                </Button>
              </div>
            </div>

            {/* Bulk Actions */}
            {/* REMOVED - Bulk actions no longer available */}

            {/* Import/Export */}
            <div className="flex flex-wrap gap-3 mt-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleImportProducts}
              >
                <Upload className="w-4 h-4" />
                Import Products
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={handleExportProducts}
              >
                <Download className="w-4 h-4" />
                Export Products
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardContent className="p-0" style={{ position: 'relative' }}>
            {isLoading ? (
              <div className="p-8">
                <div className="animate-pulse space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 bg-gray-200 rounded"></div>
                  ))}
                </div>
              </div>
            ) : products?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20">Image</TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('name')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Product Name
                          {renderSortIcon('name')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('category')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Category
                          {renderSortIcon('category')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('price')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Price
                          {renderSortIcon('price')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('sku')}
                          className="flex items-center hover:text-gray-900"
                        >
                          SKU
                          {renderSortIcon('sku')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('stock')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Stock
                          {renderSortIcon('stock')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('status')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Status
                          {renderSortIcon('status')}
                        </button>
                      </TableHead>
                      <TableHead>
                        <button
                          onClick={() => handleSort('createdAt')}
                          className="flex items-center hover:text-gray-900"
                        >
                          Created
                          {renderSortIcon('createdAt')}
                        </button>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {products.map((product: any) => (
                      <TableRow key={product.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden">
                            {getFirstImageUrl(product.images) ? (
                              <img
                                src={getFirstImageUrl(product.images)!}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <Package className="w-6 h-6" />
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 truncate">
                              {product.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {product.description?.substring(0, 50)}...
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {product.category?.name || 'Uncategorized'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{formatPrice(Number(product.price))}</p>
                            {product.originalPrice && (
                              <p className="text-xs text-gray-500 line-through">
                                {formatPrice(Number(product.originalPrice))}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded font-mono">
                            {product.sku || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${
                              product.stock === 0 ? 'text-red-600' :
                              product.stock < 10 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {product.stock}
                            </span>
                            {product.stock < 10 && product.stock > 0 && (
                              <AlertCircle className="w-4 h-4 text-yellow-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.isActive && product.stock > 0 ? 'bg-green-100 text-green-800' :
                            product.isActive && product.stock === 0 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {product.isActive && product.stock > 0 ? (
                              <Check className="w-3 h-3 mr-1" />
                            ) : product.isActive && product.stock === 0 ? (
                              <AlertCircle className="w-3 h-3 mr-1" />
                            ) : (
                              <X className="w-3 h-3 mr-1" />
                            )}
                            {product.isActive ? product.stock > 0 ? 'In Stock' : 'Out of Stock' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm text-gray-600">
                            {formatDate(product.createdAt)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <MoreVertical className="w-4 h-4" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleViewProduct(product.slug)}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Product
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleEditProduct(product.id)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit Product
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="text-red-600"
                                  onClick={() => {
                                    setProductToDelete(product.id);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Product
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-600 mb-6">
                  {search ? 'Try adjusting your search or filters' : 'Add a product to get started'}
                </p>
              </div>
            )}
            
            {/* Load More Button */}
            {hasMore && products.length > 0 && (
              <div className="p-6 text-center border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoadingMore}
                  className="gap-2"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading more...
                    </>
                  ) : (
                    `Load More (Page ${currentPage + 1} of ${totalPages})`
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={deleteDialogOpen} 
          onOpenChange={setDeleteDialogOpen}
          closeOnBackdropClick={!deleteProductMutation.isPending}
          closeOnEscape={!deleteProductMutation.isPending}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Product</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this product? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setDeleteDialogOpen(false)}
                disabled={deleteProductMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => productToDelete && deleteProductMutation.mutate(productToDelete)}
                disabled={deleteProductMutation.isPending}
              >
                {deleteProductMutation.isPending ? 'Deleting...' : 'Delete Product'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}