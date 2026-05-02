import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const store = await prisma.store.findFirst();
  console.log(store ? store.id : 'NO STORES');
}
main().catch(console.error).finally(() => prisma.$disconnect());
