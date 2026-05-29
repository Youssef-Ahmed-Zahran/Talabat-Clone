import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const lastOrder = await prisma.order.findFirst({
    orderBy: { createdAt: 'desc' },
    include: { driverAssign: true }
  });
  console.log("Last Order Status:", lastOrder.status);
  
  const history = await prisma.orderStatusHistory.findMany({
    where: { orderId: lastOrder.id }
  });
  console.log("History:", history);
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
