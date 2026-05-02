import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const methods = ["CASH", "CARD", "PAYPAL"];

  for (const method of methods) {
    await prisma.paymentMethod.upsert({
      where: { name: method },
      update: {},
      create: { name: method },
    });
    console.log(`Ensured PaymentMethod: ${method}`);
  }

  const allMethods = await prisma.paymentMethod.findMany();
  console.log("Current Payment Methods in DB:", allMethods);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
