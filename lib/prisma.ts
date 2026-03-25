import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const applyConnectionLimit = (databaseUrl: string, limit?: string) => {
  if (!limit) return databaseUrl;
  if (databaseUrl.startsWith('file:')) return databaseUrl;
  if (!databaseUrl.startsWith('postgres') && !databaseUrl.startsWith('mysql')) return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    if (!url.searchParams.has('connection_limit')) {
      url.searchParams.set('connection_limit', limit);
    }
    return url.toString();
  } catch {
    return databaseUrl;
  }
};

const databaseUrl = process.env.DATABASE_URL;
const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: applyConnectionLimit(databaseUrl, process.env.PRISMA_CONNECTION_LIMIT),
          },
        }
      : undefined,
  });

export { prisma };

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
