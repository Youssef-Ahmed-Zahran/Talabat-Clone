import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.driver.findUnique({
    where: { email: 'driver2@example.com' },
    include: {
      earnings: true
    }
  });
  
  if (!driver) {
    console.log("Driver not found");
    return;
  }
  
  console.log("Driver ID:", driver.id);
  console.log("Total Earnings Count:", driver.earnings.length);
}
main().finally(() => prisma.$disconnect());
