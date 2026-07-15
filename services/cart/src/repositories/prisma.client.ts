import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

export const prisma = new PrismaClient({
  log: [
    { emit: 'event', level: 'query' },
    { emit: 'event', level: 'error' },
    { emit: 'event', level: 'warn' },
  ],
});

prisma.$on('error', (e: unknown) => {
  logger.error('Prisma error', e);
});

prisma.$on('warn', (e: unknown) => {
  logger.warn('Prisma warning', e);
});

export default prisma;