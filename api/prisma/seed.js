import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with emergency data...');

  // 1. Geography
  console.log('Creating geography...');
  const country = await prisma.country.upsert({
    where: { code: 'EG' },
    update: {},
    create: { name: 'Egypt', code: 'EG' }
  });

  const governorate = await prisma.governorate.upsert({
    where: { name_countryId: { name: 'Cairo', countryId: country.id } },
    update: {},
    create: { name: 'Cairo', countryId: country.id }
  });

  // Cities do not have a unique constraint by default, but we can findFirst
  let city = await prisma.city.findFirst({ where: { name: 'Cairo' } });
  if (!city) {
    city = await prisma.city.create({
      data: { name: 'Cairo', countryId: country.id, governorateId: governorate.id }
    });
  }
  const cityId = city.id;

  // 2. Categories
  console.log('Creating categories...');
  const mainCat = await prisma.mainCategory.create({
    data: {
      name: 'Restaurants',
      imageUrl: 'https://res.cloudinary.com/delkk0ewe/image/upload/v1700000000/restaurants_icon.png',
      subCategories: {
        create: [
          { name: 'Pizza', imageUrl: 'https://res.cloudinary.com/delkk0ewe/image/upload/v1700000000/pizza.png' },
          { name: 'Burger', imageUrl: 'https://res.cloudinary.com/delkk0ewe/image/upload/v1700000000/burger.png' }
        ]
      }
    }
  });

  // 3. Stores
  console.log('Creating stores...');
  const store1 = await prisma.store.create({
    data: {
      name: 'Pizza Hut (Test)',
      mainCategoryId: mainCat.id,
      cityId: cityId,
      storeType: 'RESTAURANT',
      deliveryType: 'TALABAT_DELIVERY',
      latitude: 30.0444,
      longitude: 31.2357,
      ratingSum: 45,
      totalReviews: 10,
      averageRating: 4.5,
      isActive: true,
      openTime: '08:00',
      closeTime: '23:00',
      deliveryTimeMinutes: 30,
    }
  });

  const store2 = await prisma.store.create({
    data: {
      name: 'KFC (Test)',
      mainCategoryId: mainCat.id,
      cityId: cityId,
      storeType: 'RESTAURANT',
      deliveryType: 'TALABAT_DELIVERY',
      latitude: 30.0500,
      longitude: 31.2400,
      ratingSum: 40,
      totalReviews: 10,
      averageRating: 4.0,
      isActive: true,
      openTime: '08:00',
      closeTime: '23:00',
      deliveryTimeMinutes: 25,
    }
  });

  // 4. Users
  console.log('Creating test user...');
  const passwordHash = await bcrypt.hash('123456', 10);
  const user = await prisma.user.create({
    data: {
      fullName: 'Test User',
      email: 'user@test.com',
      phone: '+201234567890',
      passwordHash,
      role: 'CUSTOMER',
      isVerified: true,
      wallet: {
        create: { balance: 1000 }
      }
    }
  });

  // 5. Driver
  console.log('Creating test driver...');
  const driver = await prisma.driver.create({
    data: {
      email: 'driver@test.com',
      phone: '+201098765432',
      passwordHash,
      cityId: cityId,
      status: 'ONLINE',
      isOnline: true,
      latitude: 30.0450,
      longitude: 31.2360,
      wallet: {
        create: { balance: 0 }
      }
    }
  });

  // 6. Admin
  console.log('Creating test admin...');
  const admin = await prisma.admin.create({
    data: {
      fullName: 'Super Admin',
      email: 'admin@talabat.com',
      passwordHash,
      role: 'SUPER_ADMIN',
    }
  });

  // 7. Zone
  console.log('Creating zone...');
  // We use raw SQL because of PostGIS geometry
  const zoneId = 'zone-' + Date.now();
  await prisma.$executeRawUnsafe(`
    INSERT INTO "zones" ("id", "cityId", "name", "isActive", "updatedAt", "boundary")
    VALUES (
      '${zoneId}',
      '${cityId}',
      'Central Cairo',
      true,
      NOW(),
      ST_GeomFromText('POLYGON((31.2 30.0, 31.3 30.0, 31.3 30.1, 31.2 30.1, 31.2 30.0))', 4326)
    );
  `);

  console.log('Seeding complete! 🎉');
  console.log('-------------------------------------------');
  console.log('Test Accounts (Password: 123456 for all):');
  console.log('User: user@test.com');
  console.log('Driver: driver@test.com');
  console.log('Admin: admin@talabat.com');
  console.log('-------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
