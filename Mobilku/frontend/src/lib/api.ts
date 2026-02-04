import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    profile: '/auth/profile',
  },
  // Products
  products: {
    list: '/products',
    detail: (id: string) => `/products/${id}`,
    bySlug: (slug: string) => `/products/slug/${slug}`,
  },
  // Categories
  categories: {
    list: '/categories',
    detail: (id: string) => `/categories/${id}`,
    bySlug: (slug: string) => `/categories/slug/${slug}`,
  },
  // Cart
  cart: {
    list: '/cart',
    summary: '/cart/summary',
    add: '/cart/add',
    update: (itemId: string) => `/cart/items/${itemId}`,
    remove: (itemId: string) => `/cart/items/${itemId}`,
    clear: '/cart/clear',
  },
  // Orders
  orders: {
    list: '/orders',
    detail: (id: string) => `/orders/${id}`,
    create: '/orders',
    updateStatus: (id: string) => `/orders/${id}/status`,
    cancel: (id: string) => `/orders/${id}/cancel`,
    checkout: '/orders/checkout/cart',
  },
  // Wishlist
  wishlist: {
    list: '/wishlist',
    summary: '/wishlist/summary',
    add: '/wishlist/add',
    remove: (productId: string) => `/wishlist/remove/${productId}`,
    check: (productId: string) => `/wishlist/check/${productId}`,
    clear: '/wishlist/clear',
  },
  // Reviews
  reviews: {
    list: '/reviews',
    create: '/reviews',
    byProduct: (productId: string) => `/reviews/product/${productId}`,
    myReviews: '/reviews/my-reviews',
    detail: (id: string) => `/reviews/${id}`,
    update: (id: string) => `/reviews/${id}`,
    delete: (id: string) => `/reviews/${id}`,
  },
  // Coupons
  coupons: {
    list: '/coupons',
    detail: (id: string) => `/coupons/${id}`,
    byCode: (code: string) => `/coupons/code/${code}`,
    validate: '/coupons/validate',
  },
  // Dashboard
  dashboard: {
    overview: '/dashboard/overview',
    userStats: '/dashboard/user-stats',
  },
};
