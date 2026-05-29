import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const drivers = await prisma.driver.findMany({
    where: { email: 'driver2@example.com' },
    include: {
      application: true,
      earnings: true
    }
  });
  console.log(JSON.stringify(drivers, null, 2));
}
main().finally(() => prisma.$disconnect());
