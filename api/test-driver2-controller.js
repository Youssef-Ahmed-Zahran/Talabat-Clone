import { getMyEarnings } from './src/modules/driver/controllers/driver.controller.js';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.driver.findUnique({
    where: { email: 'driver2@example.com' }
  });
  
  if (!driver) return;
  
  // mock req, res
  const req = {
    driver: { id: driver.id }, // fixed to req.driver
    query: { period: 'this_week' }
  };
  
  const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: (code) => res
  };
  
  await getMyEarnings(req, res, (err) => console.log(err));
}
main().finally(() => prisma.$disconnect());
