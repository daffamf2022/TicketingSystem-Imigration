import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not defined in .env file.",
  );
}

const adapter = new PrismaPg({ connectionString: databaseUrl });

// Export the Prisma Client instance
export const prisma = new PrismaClient({ adapter });
export default prisma;
