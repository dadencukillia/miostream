import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/generated/client';
import { DB_URL } from './config';

export const pool = new Pool({ connectionString: DB_URL });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

export default prisma;