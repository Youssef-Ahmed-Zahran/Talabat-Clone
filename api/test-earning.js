import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const earning = await prisma.driverEarning.findFirst({
    where: { orderId: 'af95899c-7882-4888-864b-0e15f983c129' }
  });
  console.log("Earning:", earning);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
