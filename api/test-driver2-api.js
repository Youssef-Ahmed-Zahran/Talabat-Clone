import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const driver = await prisma.driver.findUnique({
    where: { email: 'driver2@example.com' }
  });
  
  if (!driver) return;
  
  const token = (await import('jsonwebtoken')).default.sign(
    { id: driver.id, role: 'driver' },
    process.env.JWT_SECRET || 'talabat-secret-key'
  );
  
  const res = await fetch('http://localhost:8080/api/drivers/earnings', {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log("Earnings API response:", JSON.stringify(data, null, 2));
}
main().finally(() => prisma.$disconnect());
