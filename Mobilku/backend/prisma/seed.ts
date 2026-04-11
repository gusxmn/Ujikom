import { PrismaClient, Role, Transmission, FuelType, DiscountType, PackageTrackingStatus } from '@prisma/client';
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
  {
    name: 'Sarah Williams',
    email: 'sarah@example.com',
    password: await bcrypt.hash('Sarah123!', 10),
    phone: '081344556677',
    address: 'Jl. Merdeka No. 100, Medan',
    role: Role.CUSTOMER,
  },
  {
    name: 'Michael Brown',
    email: 'michael@example.com',
    password: await bcrypt.hash('Michael123!', 10),
    phone: '081355667788',
    address: 'Jl. Gatot Subroto No. 50, Bekasi',
    role: Role.CUSTOMER,
  },
  {
    name: 'Emily Davis',
    email: 'emily@example.com',
    password: await bcrypt.hash('Emily123!', 10),
    phone: '081366778899',
    address: 'Jl. Ahmad Yani No. 200, Palembang',
    role: Role.CUSTOMER,
  },
  {
    name: 'David Wilson',
    email: 'david@example.com',
    password: await bcrypt.hash('David123!', 10),
    phone: '0813778899AA',
    address: 'Jl. Sudirman No. 300, Makassar',
    role: Role.CUSTOMER,
  },
  {
    name: 'Jessica Miller',
    email: 'jessica@example.com',
    password: await bcrypt.hash('Jessica123!', 10),
    phone: '081388990011',
    address: 'Jl. Gatot Kaca No. 150, Semarang',
    role: Role.CUSTOMER,
  },
  {
    name: 'Christopher Martin',
    email: 'christopher@example.com',
    password: await bcrypt.hash('Christopher123!', 10),
    phone: '081399001122',
    address: 'Jl. Imam Bonjol No. 250, Yogyakarta',
    role: Role.CUSTOMER,
  },
  {
    name: 'Lisa Anderson',
    email: 'lisa@example.com',
    password: await bcrypt.hash('Lisa123!', 10),
    phone: '081400112233',
    address: 'Jl. Pattimura No. 350, Bandung',
    role: Role.CUSTOMER,
  },
  {
    name: 'James Taylor',
    email: 'james@example.com',
    password: await bcrypt.hash('James123!', 10),
    phone: '081411223344',
    address: 'Jl. Blora No. 450, Jakarta',
    role: Role.CUSTOMER,
  },
  {
    name: 'Patricia Garcia',
    email: 'patricia@example.com',
    password: await bcrypt.hash('Patricia123!', 10),
    phone: '081422334455',
    address: 'Jl. Benda No. 550, Bogor',
    role: Role.CUSTOMER,
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

  // Create shipping methods
  const shippingMethods = [
    {
      name: 'Standard Shipping',
      description: 'Pengiriman standar 3-5 hari kerja',
      cost: 25000,
      estimatedDays: 5,
      isActive: true,
    },
    {
      name: 'Express Shipping',
      description: 'Pengiriman ekspres 1-2 hari kerja',
      cost: 50000,
      estimatedDays: 2,
      isActive: true,
    },
    {
      name: 'Same Day Delivery',
      description: 'Pengiriman hari yang sama',
      cost: 100000,
      estimatedDays: 1,
      isActive: true,
    },
    {
      name: 'Free Shipping',
      description: 'Gratis ongkos kirim untuk pembelian minimal Rp 1.000.000',
      cost: 0,
      estimatedDays: 7,
      isActive: true,
    },
  ];

  for (const method of shippingMethods) {
    await prisma.shippingMethod.create({
      data: method,
    });
    console.log(`✅ Shipping method created: ${method.name}`);
  }

  // Create sample products
  const products = [
    {
      name: 'Toyota Fortuner',
      description: 'SUV 7-seater dengan mesin diesel 2.4L tangguh, fitur safety lengkap',
      sku: 'SKU-TOYOTA-FORTUNER-001',
      slug: 'toyota-fortuner',
      price: 550000000,
      year: 2023,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.DIESEL,
      mileage: 10000,
      color: 'Hitam',
      stock: 5,
      rating: 4.5,
      images: ['fortuner1.jpg', 'fortuner2.jpg', 'fortuner3.jpg'],
      categoryId: createdCategories[0].id,
    },
    {
      name: 'Honda Civic',
      description: 'Sedan sporty dengan teknologi canggih, mesin turbo 1.5L',
      sku: 'SKU-HONDA-CIVIC-002',
      slug: 'honda-civic',
      price: 600000000,
      year: 2023,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      mileage: 5000,
      color: 'Putih',
      stock: 3,
      rating: 4.6,
      images: ['civic1.jpg', 'civic2.jpg'],
      categoryId: createdCategories[1].id,
    },
    {
      name: 'Toyota Avanza',
      description: 'MPV keluarga dengan 7 seat nyaman, hemat bahan bakar',
      sku: 'SKU-TOYOTA-AVANZA-003',
      slug: 'toyota-avanza',
      price: 250000000,
      year: 2023,
      transmission: Transmission.MANUAL,
      fuelType: FuelType.GASOLINE,
      mileage: 15000,
      color: 'Silver',
      stock: 10,
      rating: 4.3,
      images: ['avanza1.jpg', 'avanza2.jpg'],
      categoryId: createdCategories[2].id,
    },
    {
      name: 'BMW X5',
      description: 'SUV luxury dengan interior premium, teknologi driving assist',
      sku: 'SKU-BMW-X5-004',
      slug: 'bmw-x5',
      price: 1500000000,
      year: 2024,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.HYBRID,
      mileage: 0,
      color: 'Biru',
      stock: 2,
      rating: 4.8,
      images: ['bmw1.jpg', 'bmw2.jpg', 'bmw3.jpg'],
      categoryId: createdCategories[5].id,
    },
    {
      name: 'Tesla Model 3',
      description: 'Electric vehicle dengan autopilot, akselerasi 0-100 dalam 3.3 detik',
      sku: 'SKU-TESLA-MODEL3-005',
      slug: 'tesla-model-3',
      price: 1200000000,
      year: 2024,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.ELECTRIC,
      mileage: 0,
      color: 'Putih',
      stock: 4,
      rating: 4.9,
      images: ['tesla1.jpg', 'tesla2.jpg'],
      categoryId: createdCategories[6].id,
    },
    {
      name: 'Toyota Alphard',
      description: 'MPV premium dengan interior mewah, fitur hiburan lengkap',
      sku: 'SKU-TOYOTA-ALPHARD-006',
      slug: 'toyota-alphard',
      price: 1200000000,
      year: 2023,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      mileage: 20000,
      color: 'Hitam',
      stock: 3,
      rating: 4.7,
      images: ['alphard1.jpg', 'alphard2.jpg'],
      categoryId: createdCategories[2].id,
    },
    {
      name: 'Nissan GT-R',
      description: 'Sports car dengan performa tinggi, akselerasi 0-100 dalam 2.7 detik',
      sku: 'SKU-NISSAN-GTR-007',
      slug: 'nissan-gt-r',
      price: 2500000000,
      year: 2024,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      mileage: 0,
      color: 'Merah',
      stock: 1,
      rating: 4.9,
      images: ['gtr1.jpg', 'gtr2.jpg', 'gtr3.jpg'],
      categoryId: createdCategories[4].id,
    },
    {
      name: 'Honda Jazz',
      description: 'Hatchback kompak dengan ruang interior luas, efisiensi bahan bakar tinggi',
      sku: 'SKU-HONDA-JAZZ-008',
      slug: 'honda-jazz',
      price: 350000000,
      year: 2024,
      transmission: Transmission.AUTOMATIC,
      fuelType: FuelType.GASOLINE,
      mileage: 0,
      color: 'Oranye',
      stock: 6,
      rating: 4.4,
      images: ['jazz1.jpg', 'jazz2.jpg'],
      categoryId: createdCategories[3].id,
    },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  // Create sample orders
  const allProducts = await prisma.product.findMany();
  const allCustomers = await prisma.user.findMany({ where: { role: Role.CUSTOMER } });

  if (allProducts.length > 0 && allCustomers.length > 0) {
    let orderIndex = 0;
    
    // Helper function to create orders for specific time period
    const createOrdersForPeriod = async (
      orderCount: number,
      periodName: string,
      getOrderDate: (index: number) => Date
    ) => {
      for (let i = 0; i < orderCount; i++) {
        const customerIndex = (orderIndex + i) % allCustomers.length;
        const productIndex = (orderIndex + i) % allProducts.length;
        const orderDate = getOrderDate(i);
        
        const totalAmount = allProducts[productIndex].price;
        
        try {
          await prisma.order.create({
            data: {
              orderNumber: `ORD-2026${orderDate.getMonth().toString().padStart(2, '0')}${orderDate.getDate().toString().padStart(2, '0')}-${String(1000 + orderIndex + i).slice(-4)}`,
              userId: allCustomers[customerIndex].id,
              totalAmount: totalAmount,
              status: Math.random() > 0.3 ? 'DELIVERED' : (Math.random() > 0.4 ? 'SHIPPED' : 'PROCESSING'),
              shippingAddress: allCustomers[customerIndex].address || 'Jl. Sample No. 100, Jakarta',
              notes: `${periodName} order`,
              createdAt: orderDate,
              items: {
                create: [
                  {
                    productId: allProducts[productIndex].id,
                    quantity: 1,
                    price: totalAmount,
                  },
                ],
              },
            },
          });
          orderIndex++;
        } catch (e) {
          console.error('Error creating order:', e);
        }
      }
      console.log(`✅ ${orderCount} ${periodName} orders created`);
    };

    // TODAY - Multiple orders at different times
    await createOrdersForPeriod(3, 'Today', (index) => {
      const date = new Date();
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      date.setSeconds(Math.floor(Math.random() * 60));
      return date;
    });

    // THIS WEEK (last 6 days excluding today)
    await createOrdersForPeriod(6, 'This Week', (index) => {
      const date = new Date();
      date.setDate(date.getDate() - (index + 1)); // Days 1-6 ago
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      return date;
    });

    // THIS MONTH (throughout April 2026)
    await createOrdersForPeriod(8, 'This Month', (index) => {
      const date = new Date(2026, 3, 1); // April 1, 2026
      date.setDate(Math.floor(Math.random() * 28) + 1); // Random day in April
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      return date;
    });

    // LAST MONTH (March 2026)
    await createOrdersForPeriod(8, 'Last Month', (index) => {
      const date = new Date(2026, 2, 1); // March 1, 2026
      date.setDate(Math.floor(Math.random() * 28) + 1); // Random day in March
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      return date;
    });

    // TWO MONTHS AGO (February 2026)
    await createOrdersForPeriod(5, 'Two Months Ago', (index) => {
      const date = new Date(2026, 1, 1); // February 1, 2026
      date.setDate(Math.floor(Math.random() * 28) + 1); // Random day in February
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      return date;
    });

    // THREE MONTHS AGO (January 2026)
    await createOrdersForPeriod(5, 'Three Months Ago', (index) => {
      const date = new Date(2026, 0, 1); // January 1, 2026
      date.setDate(Math.floor(Math.random() * 28) + 1); // Random day in January
      date.setHours(Math.floor(Math.random() * 24));
      date.setMinutes(Math.floor(Math.random() * 60));
      return date;
    });

    console.log(`\n✅ Total ${orderIndex} orders created with proper time distribution!`);
  }

  // Create package tracking for shipped and delivered orders
  const shippedOrDeliveredOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ['SHIPPED', 'DELIVERED'],
      },
    },
  });

  const carriers = ['JNE', 'Pos Indonesia', 'TIKI', 'Ninja Express', 'SiCepat'];
  const locations = [
    'Jakarta Warehouse',
    'Tangerang Hub',
    'Bandung Center',
    'Surabaya Terminal',
    'Medan Office',
    'Bekasi Distribution',
    'Depok Sorting Center',
  ];

  for (let i = 0; i < shippedOrDeliveredOrders.length; i++) {
    const order = shippedOrDeliveredOrders[i];
    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const trackingNumber = `TRK${Date.now()}${i}`.slice(0, 20);
    const estimatedDelivery = new Date(order.createdAt);
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 5) + 3);

    try {
      const tracking = await prisma.packageTracking.create({
        data: {
          trackingNumber,
          orderId: order.id,
          status: order.status === 'DELIVERED' ? 'DELIVERED' : 'OUT_FOR_DELIVERY',
          carrier,
          shippingAddress: order.shippingAddress || { address: 'Jl. Default' },
          estimatedDelivery,
          actualDelivery: order.status === 'DELIVERED' ? new Date() : undefined,
          currentLocation: locations[Math.floor(Math.random() * locations.length)],
          trackingHistory: {
            create: [
              {
                status: 'PENDING',
                location: 'Warehouse Jakarta',
                description: 'Paket sedang diproses',
                timestamp: order.createdAt,
              },
              {
                status: 'IN_WAREHOUSE',
                location: 'Jakarta Hub',
                description: 'Paket di warehouse',
                timestamp: new Date(order.createdAt.getTime() + 2 * 60 * 60 * 1000),
              },
              {
                status: 'SHIPPED',
                location: `${carrier} Distribution Center`,
                description: 'Paket telah dikirim',
                timestamp: new Date(order.createdAt.getTime() + 4 * 60 * 60 * 1000),
              },
              {
                status: 'IN_TRANSIT',
                location: locations[Math.floor(Math.random() * locations.length)],
                description: 'Paket dalam perjalanan',
                timestamp: new Date(order.createdAt.getTime() + 24 * 60 * 60 * 1000),
              },
              {
                status: 'OUT_FOR_DELIVERY',
                location: 'Delivery Station',
                description: 'Paket siap diantar hari ini',
                timestamp: new Date(order.createdAt.getTime() + 48 * 60 * 60 * 1000),
              },
              ...(order.status === 'DELIVERED'
                ? [
                    {
                      status: 'DELIVERED' as const,
                      location: 'Tujuan',
                      description: 'Paket telah diterima',
                      timestamp: new Date(order.createdAt.getTime() + 72 * 60 * 60 * 1000),
                    },
                  ]
                : []),
            ],
          },
        },
      });
    } catch (e) {
      console.error(`Error creating tracking for order ${order.id}:`, e);
    }
  }

  console.log(`✅ Package tracking created for ${shippedOrDeliveredOrders.length} orders`);

  // Create reviews for all products
  // Fetch all products and customers for reviews (if not already fetched)
  let reviewProducts = await prisma.product.findMany();
  let reviewCustomers = await prisma.user.findMany({ where: { role: Role.CUSTOMER } });

  if (reviewProducts.length > 0 && reviewCustomers.length > 0) {
    const reviewComments = {
      positive: [
        'Mobil ini sangat memuaskan! Kualitas sangat baik.',
        'Performa luar biasa, saya sangat puas dengan pembelian ini.',
        'Rekomendaasi banget! Mobil ini worth it untuk dibeli.',
        'Sangat nyaman dan aman untuk berkendara keluarga.',
        'Fitur-fiturnya lengkap dan mudah digunakan.',
        'Layanan purna jual sangat responsif dan membantu.',
        'Desain exterior dan interior sangat menawan.',
        'Hemat bahan bakar dan performa mesin sangat baik.',
      ],
      good: [
        'Bagus, namun harga sedikit mahal.',
        'Sesuai ekspektasi, pengiriman tepat waktu.',
        'Kenyamanan berkendara cukup baik untuk perjalanan jauh.',
        'Spesifikasi sesuai dengan yang dijanjikan.',
      ],
      neutral: [
        'Cukup memuaskan untuk harga yang ditawarkan.',
        'Baik, tapi ada beberapa fitur yang bisa ditingkatkan.',
      ],
    };

    for (const product of reviewProducts) {
      // Create 2-4 reviews for each product
      const reviewCount = Math.floor(Math.random() * 3) + 2;
      
      for (let i = 0; i < reviewCount; i++) {
        const customerIndex = (reviewProducts.indexOf(product) + i) % reviewCustomers.length;
        const ratingValue = Math.floor(Math.random() * 2) + 4; // 4 or 5 stars mostly
        
        let commentary = '';
        if (ratingValue === 5) {
          commentary = reviewComments.positive[Math.floor(Math.random() * reviewComments.positive.length)];
        } else if (ratingValue === 4) {
          commentary = reviewComments.good[Math.floor(Math.random() * reviewComments.good.length)];
        } else {
          commentary = reviewComments.neutral[Math.floor(Math.random() * reviewComments.neutral.length)];
        }

        try {
          await prisma.review.create({
            data: {
              productId: product.id,
              userId: reviewCustomers[customerIndex].id,
              rating: ratingValue,
              comment: commentary,
              isActive: true,
            },
          });
        } catch (e) {
          // Skip if review already exists (unique constraint)
        }
      }
      console.log(`✅ Reviews created for: ${product.name}`);
    }
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
  console.log('\n📊 Database Summary:');
  console.log('======================');
  console.log('🚗 Products: 8 mobil dengan rating & reviews');
  console.log('🏷️  Categories: 7 kategori');
  console.log('🚚 Shipping Methods: 4 metode pengiriman');
  console.log('👥 Customers: 14 test customers');
  console.log('📦 Orders: 35 orders across different time periods');
  console.log('⭐ Reviews: Multiple reviews per product with ratings');
  console.log('📍 Package Tracking: Created for all shipped/delivered orders');
  console.log('\n✨ Try these demo credentials:');
  console.log('  Admin: admin@example.com / Admin123!');
  console.log('  Customer: customer@example.com / Customer123!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });