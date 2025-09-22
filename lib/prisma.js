import { PrismaClient } from '@prisma/client';

let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    transactionOptions: {
      timeout: 15000,
      maxWait: 5000,
    },
  });
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      transactionOptions: {
        timeout: 15000,
        maxWait: 5000,
      },
    });
  }
  prisma = global.prisma;
}

export default prisma;