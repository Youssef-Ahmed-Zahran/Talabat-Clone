import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const driverId = '62cf05d3-a73d-4ee0-bff5-6b9701d099a5';
  
  const [earnings, total] = await Promise.all([
    prisma.driverEarning.findMany({
        where: { driverId },
        take: 100,
        orderBy: { createdAt: "desc" },
        include: {
            order: { select: { id: true, createdAt: true } },
        },
    }),
    prisma.driverEarning.count({ where: { driverId } })
  ]);
  
  console.log("Earnings length:", earnings.length);
  if (earnings.length > 0) {
      console.log("First earning orderId:", earnings[0].orderId);
  }
}
main().finally(() => prisma.$disconnect());
