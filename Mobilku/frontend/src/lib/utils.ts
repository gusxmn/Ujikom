export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

const BACKEND_URL = 'http://localhost:3001';

// Build image URL with backend URL if needed
export const buildImageUrl = (url: string): string => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  // Ensure uploads prefix is present
  if (!url.startsWith('/uploads') && !url.startsWith('/images')) {
    return `${BACKEND_URL}/uploads/${url}`;
  }
  if (url.startsWith('/')) return `${BACKEND_URL}${url}`;
  return `${BACKEND_URL}/${url}`;
};

export const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string | null | undefined): string => {
  if (!date) return 'Never';
  const d = new Date(date);
  if (isNaN(d.getTime())) return 'Invalid Date';
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('id-ID').format(num);
};

export const truncateText = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Parse product images from JSON (images are stored as JSON string with { filename, url } objects)
export const parseProductImages = (images: any): string[] => {
  try {
    if (typeof images === 'string') {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.map((img: any) => buildImageUrl(img.url || img)) : [];
    } else if (Array.isArray(images)) {
      return images.map((img: any) => buildImageUrl(typeof img === 'string' ? img : img.url));
    }
  } catch (e) {
    console.error('Failed to parse images:', e);
  }
  return [];
};

// Get first image URL from product images
export const getFirstImageUrl = (images: any): string | null => {
  const urls = parseProductImages(images);
  return urls.length > 0 ? urls[0] : null;
};
