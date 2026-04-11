// Simulate the utils
const BACKEND_URL = 'http://localhost:3001';

const buildImageUrl = (url) => {
  if (!url) return '/placeholder.png';
  if (url.startsWith('http')) return url;
  if (!url.startsWith('/uploads') && !url.startsWith('/images')) {
    return `${BACKEND_URL}/uploads/${url}`;
  }
  if (url.startsWith('/')) return `${BACKEND_URL}${url}`;
  return `${BACKEND_URL}/${url}`;
};

const parseProductImages = (images) => {
  try {
    if (typeof images === 'string') {
      const parsed = JSON.parse(images);
      return Array.isArray(parsed) ? parsed.map((img) => buildImageUrl(img.url || img)) : [];
    } else if (Array.isArray(images)) {
      return images.map((img) => buildImageUrl(typeof img === 'string' ? img : img.url));
    }
  } catch (e) {
    console.error('Failed to parse images:', e);
  }
  return [];
};

const getFirstImageUrl = (images) => {
  const urls = parseProductImages(images);
  return urls.length > 0 ? urls[0] : null;
};

// Test
console.log('Test 1 - Array of strings:');
console.log(getFirstImageUrl(['jazz1.jpg', 'jazz2.jpg']));

console.log('\nTest 2 - String filename:');
console.log(buildImageUrl('jazz1.jpg'));

console.log('\nTest 3 - All parsed images from API response:');
console.log(parseProductImages(['honda1.jpg', 'honda2.jpg']));
