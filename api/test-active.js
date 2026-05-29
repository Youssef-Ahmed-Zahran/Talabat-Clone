import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const driverId = '62cf05d3-a73d-4ee0-bff5-6b9701d099a5'; // from the output
  const activeOrders = await prisma.orderDriverAssignment.findMany({
    where: {
      driverId,
      status: "ACCEPTED",
      order: {
        status: {
          notIn: ["DELIVERED", "CANCELLED"]
        }
      }
    },
    include: { order: true }
  });
  console.log("Active Orders Count:", activeOrders.length);
  if (activeOrders.length > 0) {
    console.log("Order Statuses:", activeOrders.map(a => a.order.status));
  }
}
main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
