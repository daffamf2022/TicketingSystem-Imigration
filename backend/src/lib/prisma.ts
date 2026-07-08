import { PrismaClient } from "../generated/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable is not defined in .env file.",
  );
}

// Instantiate the Prisma adapter for MariaDB directly with the connection string
const adapter = new PrismaMariaDb(databaseUrl);

// Export the Prisma Client instance
export const prisma = new PrismaClient({ adapter });
export default prisma;
