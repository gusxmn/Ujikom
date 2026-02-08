import { PrismaClient, Role, Transmission, FuelType, DiscountType } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding database...');

  // Hapus data lama jika ada (untuk development) - dalam urutan yang benar untuk foreign keys
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.review.deleteMany();
  await prisma.wishlist.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shippingAddress.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Administrator',
      email: 'admin@example.com',
      password: adminPassword,
      phone: '081234567890',
      address: 'Jl. Alam No. 1',
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create test customer
  const customerPassword = await bcrypt.hash('Customer123!', 10);
  const customer = await prisma.user.create({
    data: {
      name: 'John Customer',
      email: 'customer@example.com',
      password: customerPassword,
      phone: '081298765432',
      address: 'Jl. Soya No. 123, Jakarta',
      role: Role.CUSTOMER,
      isActive: true,
    },
  });
  console.log('✅ Customer user created:', customer.email);

  const additionalUsers = [
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: await bcrypt.hash('Jane123!', 10),
    phone: '081311223344',
    address: 'Jl. Sayur No. 456, Bandung',
    role: Role.CUSTOMER,
  },
  {
    name: 'Bob Johnson',
    email: 'bob@example.com',
    password: await bcrypt.hash('Bob123!', 10),
    phone: '081322334455',
    address: 'Jl. Contoh No. 789, Surabaya',
    role: Role.CUSTOMER,
  },
  {
    name: 'Admin 2',
    email: 'admin2@example.com',
    password: await bcrypt.hash('Admin123!', 10),
    phone: '081333445566',
    address: 'Jl. Admin No. 2',
    role: Role.ADMIN,
  },
];

for (const userData of additionalUsers) {
  await prisma.user.upsert({
    where: { email: userData.email },
    update: {},
    create: userData,
  });
  console.log(`✅ User created: ${userData.email}`);
}

// Create some coupons
const coupons = [
  {
    code: 'WELCOME10',
    discountType: DiscountType.PERCENTAGE,
    value: 10,
    minPurchase: 0,
    maxDiscount: 100000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    usageLimit: 1000,
    isActive: true,
  },
  {
    code: 'FREESHIP',
    discountType: DiscountType.FIXED_AMOUNT,
    value: 20000,
    minPurchase: 200000,
    maxDiscount: 20000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    usageLimit: 500,
    isActive: true,
  },
  {
    code: 'BIGSALE',
    discountType: DiscountType.PERCENTAGE,
    value: 20,
    minPurchase: 500000,
    maxDiscount: 500000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    usageLimit: 100,
    isActive: true,
  },
];

for (const coupon of coupons) {
  await prisma.coupon.upsert({
    where: { code: coupon.code },
    update: {},
    create: coupon,
  });
  console.log(`✅ Coupon created: ${coupon.code}`);
}

  // Create categories
  const categories = [
    { name: 'SUV', description: 'Sport Utility Vehicle', slug: 'suv' },
    { name: 'Sedan', description: 'Mobil penumpang', slug: 'sedan' },
    { name: 'MPV', description: 'Multi Purpose Vehicle', slug: 'mpv' },
    { name: 'Hatchback', description: 'Mobil kompak', slug: 'hatchback' },
    { name: 'Sport', description: 'Mobil sport', slug: 'sport' },
    { name: 'SUV Luxury', description: 'SUV mewah', slug: 'suv-luxury' },
    { name: 'Electric Vehicle', description: 'Kendaraan listrik', slug: 'electric' },
  ];

  const createdCategories = [];
  for (const category of categories) {
    const created = await prisma.category.create({
      data: category,
    });
    createdCategories.push(created);
    console.log(`✅ Category created: ${category.name}`);
  }

  // Create sample products
  const products = [
    {
      name: 'Toyota Fortuner',
      description: 'SUV 7-seater dengan mesin diesel 2.4L tangguh, fitur safety lengkap',
      slug: 'toyota-fortuner',
      price: 550000000,
      year: 2023,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      mileage: 10000,
      color: 'Hitam',
      stock: 5,
      images: ['fortuner1.jpg', 'fortuner2.jpg', 'fortuner3.jpg'],
      categoryId: createdCategories[0].id,
    },
    {
      name: 'Honda Civic',
      description: 'Sedan sporty dengan teknologi canggih, mesin turbo 1.5L',
      slug: 'honda-civic',
      price: 600000000,
      year: 2023,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      mileage: 5000,
      color: 'Putih',
      stock: 3,
      images: ['civic1.jpg', 'civic2.jpg'],
      categoryId: createdCategories[1].id,
    },
    {
      name: 'Toyota Avanza',
      description: 'MPV keluarga dengan 7 seat nyaman, hemat bahan bakar',
      slug: 'toyota-avanza',
      price: 250000000,
      year: 2023,
      transmission: Transmission.MANUAL,
      fuelType: FuelType.GASOLINE,
      mileage: 15000,
      color: 'Silver',
      stock: 10,
      images: ['avanza1.jpg', 'avanza2.jpg'],
      categoryId: createdCategories[2].id,
    },
    {
      name: 'BMW X5',
      description: 'SUV luxury dengan interior premium, teknologi driving assist',
      slug: 'bmw-x5',
      price: 1500000000,
      year: 2024,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      mileage: 0,
      color: 'Biru',
      stock: 2,
      images: ['bmw1.jpg', 'bmw2.jpg', 'bmw3.jpg'],
      categoryId: createdCategories[5].id,
    },
    {
      name: 'Tesla Model 3',
      description: 'Electric vehicle dengan autopilot, akselerasi 0-100 dalam 3.3 detik',
      slug: 'tesla-model-3',
      price: 1200000000,
      year: 2024,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.ELECTRIC,
      mileage: 0,
      color: 'Putih',
      stock: 4,
      images: ['tesla1.jpg', 'tesla2.jpg'],
      categoryId: createdCategories[6].id,
    },
    {
      name: 'Toyota Alphard',
      description: 'MPV premium dengan interior mewah, fitur hiburan lengkap',
      slug: 'toyota-alphard',
      price: 1200000000,
      year: 2023,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      mileage: 20000,
      color: 'Hitam',
      stock: 3,
      images: ['alphard1.jpg', 'alphard2.jpg'],
      categoryId: createdCategories[2].id,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  console.log('\n🎉 Seeding completed!');
  console.log('\n📋 Default Credentials:');
  console.log('======================');
  console.log('👨‍💼 Admin:');
  console.log('  Email: admin@example.com');
  console.log('  Password: Admin123!');
  console.log('\n👤 Customer:');
  console.log('  Email: customer@example.com');
  console.log('  Password: Customer123!');
  console.log('\n🚗 Products created: 6 mobil');
  console.log('🏷️  Categories created: 7 kategori');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });