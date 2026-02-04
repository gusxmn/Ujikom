# 🚗 Online Shop Mobil - Backend API

Backend sistem informasi online shop mobil berbasis web menggunakan NestJS, TypeScript, dan MySQL.

## 🚀 Fitur Utama

- **🔐 Authentication & Authorization**: Login, register, JWT token, role-based access control
- **🏷️ Kategori**: CRUD kategori mobil
- **🚗 Produk**: CRUD produk mobil dengan gambar, filter, pencarian
- **📦 Order**: Sistem order, keranjang, checkout
- **💳 Payment**: Integrasi Xendit (Virtual Account, E-Wallet, dll)
- **📊 Dashboard**: Statistik untuk admin
- **📤 Upload**: Upload gambar produk

## 🛠️ Teknologi

- **Runtime**: Node.js 18+
- **Framework**: NestJS 10
- **Language**: TypeScript
- **Database**: MySQL 8
- **ORM**: Prisma
- **Payment**: Xendit
- **Auth**: JWT, Passport
- **API Docs**: Swagger/OpenAPI

## 📦 Instalasi

### 1. Prerequisites
- Node.js 18+
- MySQL 8
- Git

### 2. Clone & Setup
```bash
# Clone repository
git clone https://github.com/yourusername/online-shop-mobil.git
cd online-shop-mobil/backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda