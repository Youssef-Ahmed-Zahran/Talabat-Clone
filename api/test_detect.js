import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function run() {
  const lat = 30.0444; // Cairo
  const lng = 31.2357; // Cairo
  try {
     const rows = await prisma.$queryRaw`
        SELECT id, name
        FROM public.zones
        WHERE "isActive" = true
          AND ST_Within(
            ST_SetSRID(ST_MakePoint(${Number(lng)}, ${Number(lat)}), 4326),
            boundary
          )
        LIMIT 1
    `;
    console.log("Zone found:", rows);
  } catch (e) {
    console.error("Error:", e);
  } finally {
    await prisma.$disconnect();
  }
}
run();
