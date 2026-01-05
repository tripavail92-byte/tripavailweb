import { Injectable, OnModuleInit } from '@nestjs/common';

// Use dynamic require so builds do not fail if Prisma types are not generated yet
// and to avoid TS type errors when the client is missing at build time.
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const { PrismaClient } = require('@prisma/client') as { PrismaClient: new () => any };

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    if (process.env.SKIP_DB === '1') {
      return;
    }
    if (typeof (this as any).$connect === 'function') {
      await (this as any).$connect();
    }
  }
}
