# 🚀 Panduan Menjalankan Aplikasi Backend Mobilku

## 📋 Persyaratan
- Node.js v18+
- MySQL 8.0+
- Laragon (atau MySQL standalone)

---

## 🎯 Langkah 1: Setup Awal (Hanya Lakukan Sekali)

### 1.1 Buka Terminal dan Masuk ke Folder Backend
```bash
cd C:\laragon\www\Ujikom\Mobilku\backend
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Setup Database
```bash
# Generate Prisma Client
npx prisma generate

# Jalankan Migration
npx prisma migrate dev

# Seed Database (Tambah Data Sample)
npm run prisma:seed
```

---

## ▶️ Langkah 2: Menjalankan Aplikasi

### Option A: Development Mode (Dengan Auto-Reload)
```bash
npm run start:dev
```
✅ Server akan restart otomatis saat ada perubahan file

### Option B: Production Mode (Recommended untuk Testing)
```bash
# Build terlebih dahulu
npm run build

# Jalankan production
npm run start:prod
```

---

## ✅ Verifikasi Server Berjalan

Setelah menjalankan aplikasi, lihat output terminal:

```
🚀 Application is running on: http://localhost:3000
📚 API Documentation: http://localhost:3000/api-docs
🔧 Health Check: http://localhost:3000/health
💾 Database: MySQL at localhost:3306/carify
```

Jika melihat output di atas, berarti **SERVER SUDAH BERHASIL DIJALANKAN** ✅

---

## 🌐 Akses Aplikasi

### 1. API Documentation (Swagger)
```
http://localhost:3000/api-docs
```
- Lihat semua endpoint
- Test API langsung dari browser
- Lihat struktur request/response

### 2. Health Check
```
http://localhost:3000/health
```
- Pastikan server sehat dan responsive

### 3. Postman Testing
- Import semua endpoint dari Swagger
- Atau buat request manual
- Base URL: `http://localhost:3000`

---

## 👤 Akun Default untuk Testing

### Admin Account
```
Email: admin@example.com
Password: Admin123!
```

### Customer Account
```
Email: customer@example.com
Password: Customer123!
```

---

## 🔑 Test Login di Postman

### 1. POST Request
```
POST http://localhost:3000/auth/login
```

### 2. Body (JSON)
```json
{
  "email": "admin@example.com",
  "password": "Admin123!"
}
```

### 3. Response (Jika Berhasil)
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@example.com",
    "name": "Admin User",
    "role": "ADMIN"
  }
}
```

---

## 📦 Main Features & Endpoints

### Authentication
- `POST /auth/login` - Login
- `POST /auth/register` - Register Customer
- `POST /auth/register/admin` - Register Admin
- `GET /auth/profile` - Get Current User Profile

### Products
- `GET /products` - List Produk
- `GET /products/:id` - Detail Produk
- `POST /products` - Create Produk (Admin)
- `PATCH /products/:id` - Update Produk (Admin)
- `DELETE /products/:id` - Delete Produk (Admin)

### Categories
- `GET /categories` - List Kategori
- `POST /categories` - Create Kategori (Admin)
- `PATCH /categories/:id` - Update Kategori (Admin)
- `DELETE /categories/:id` - Delete Kategori (Admin)

### Orders
- `GET /orders` - List Order User
- `POST /orders` - Create Order
- `GET /orders/:id` - Detail Order
- `PATCH /orders/:id/status` - Update Status (Admin)
- `DELETE /orders/:id/cancel` - Cancel Order

### Cart
- `GET /cart` - View Cart
- `POST /cart/add` - Add to Cart
- `PATCH /cart/items/:itemId` - Update Cart Item
- `DELETE /cart/items/:itemId` - Remove Cart Item
- `DELETE /cart/clear` - Clear Cart

### Reviews
- `POST /reviews` - Create Review
- `GET /reviews/product/:productId` - Get Product Reviews
- `GET /reviews/my-reviews` - My Reviews
- `PATCH /reviews/:id` - Update Review
- `DELETE /reviews/:id` - Delete Review

### Wishlist
- `GET /wishlist` - View Wishlist
- `POST /wishlist/add` - Add to Wishlist
- `DELETE /wishlist/remove/:productId` - Remove from Wishlist
- `DELETE /wishlist/clear` - Clear Wishlist

### Coupons
- `GET /coupons` - List Coupon
- `POST /coupons/validate` - Validate Coupon

### Dashboard (Admin)
- `GET /dashboard/overview` - Dashboard Overview
- `GET /dashboard/user-stats` - User Statistics

### Payments
- `POST /payments/create` - Create Payment

### Shipping Addresses
- `GET /shipping-addresses` - List Alamat
- `POST /shipping-addresses` - Tambah Alamat
- `PATCH /shipping-addresses/:id/set-primary` - Set Primary Address

---

## 🐛 Troubleshooting

### Server Tidak Berjalan
```bash
# Kill semua process node
Get-Process node | Stop-Process -Force

# Coba jalankan lagi
npm run start:prod
```

### Error "Port 3000 Already in Use"
```bash
# Kill process yang menggunakan port 3000
netstat -ano | findstr ":3000"
taskkill /PID <PID> /F
```

### Database Connection Error
```bash
# Pastikan MySQL running di Laragon
# Check .env DATABASE_URL
# Default: mysql://root@localhost:3306/carify
```

### Prisma Error
```bash
# Regenerate Prisma Client
npx prisma generate

# Reset Database (Hati-hati! Hapus semua data)
npx prisma migrate reset
```

---

## 📚 Struktur Project

```
backend/
├── src/
│   ├── main.ts                 # Entry point
│   ├── app.module.ts           # Root module
│   ├── modules/                # Feature modules
│   │   ├── auth/               # Authentication
│   │   ├── users/              # User management
│   │   ├── products/           # Products
│   │   ├── categories/         # Categories
│   │   ├── orders/             # Orders
│   │   ├── cart/               # Shopping cart
│   │   ├── reviews/            # Reviews system
│   │   ├── wishlist/           # Wishlist
│   │   ├── coupons/            # Coupons
│   │   ├── payments/           # Payments
│   │   ├── dashboard/          # Admin dashboard
│   │   └── shipping-addresses/ # Shipping addresses
│   ├── common/
│   │   ├── guards/             # JWT auth guards
│   │   ├── decorators/         # Custom decorators
│   │   └── interceptors/       # HTTP interceptors
│   └── database/
│       └── prisma/             # Prisma setup
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Sample data
├── dist/                       # Compiled code
├── .env                        # Environment variables
└── package.json                # Dependencies
```

---

## 🔧 Debugging

### Lihat Database
```bash
npx prisma studio
```
Akan membuka UI untuk melihat data di database secara real-time.

### Cek Errors
Lihat output terminal untuk melihat error messages.

### Enable Debug Mode
```bash
# Di terminal
$env:DEBUG="*"
npm run start:prod
```

---

## ✨ Selesai!

Backend sudah siap digunakan. Sekarang Anda bisa:
1. ✅ Test semua API di Postman
2. ✅ Lihat dokumentasi di Swagger
3. ✅ Connect dengan Frontend
4. ✅ Deploy ke Production

Selamat menggunakan! 🎉
