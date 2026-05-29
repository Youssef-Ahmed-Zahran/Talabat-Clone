import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const driverId = '62cf05d3-a73d-4ee0-bff5-6b9701d099a5';
  
  const earnings = await prisma.driverEarning.findMany({
        where: { driverId },
        take: 3,
        orderBy: { createdAt: "desc" },
  });
  
  console.log("Recent earnings:", earnings);
}
main().finally(() => prisma.$disconnect());
