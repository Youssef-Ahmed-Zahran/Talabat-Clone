import { detectZone } from './src/modules/zone/controllers/zone.controller.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  try {
     // Let's get the latest store
     const store = await prisma.store.findFirst({
        orderBy: { createdAt: 'desc' }
     });
     console.log('Latest store:', store.name, 'lat:', store.latitude, 'lng:', store.longitude);
     
     const zone = await detectZone(store.latitude, store.longitude);
     console.log('Detected zone for this store:', zone);
     
     // Check if it has a StoreZone relation
     const storeZone = await prisma.storeZone.findFirst({ where: { storeId: store.id } });
     console.log('Actual storeZone in DB:', storeZone);
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
