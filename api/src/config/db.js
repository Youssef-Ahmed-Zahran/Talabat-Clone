import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Connection
async function connectDB() {
  try {
    await prisma.$connect();
    console.log("DB Work 😍");
  } catch (err) {
    console.log(`Error ${err.message}`);
    process.exit(1);
  }
}

// Initialize database connection
connectDB();

// Handle graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

export default prisma;
