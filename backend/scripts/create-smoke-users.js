/* Creates smoke-test traveler and admin users (idempotent) */
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Creating smoke-test users...');

  await prisma.user.upsert({
    where: { email: 'traveler.smoke@test.com' },
    update: {
      role: 'TRAVELER',
      emailVerified: true,
      phoneVerified: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'traveler_smoke_1',
      email: 'traveler.smoke@test.com',
      role: 'TRAVELER',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'admin.smoke@test.com' },
    update: {
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
      updatedAt: new Date(),
    },
    create: {
      id: 'admin_smoke_1',
      email: 'admin.smoke@test.com',
      role: 'ADMIN',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log('Done.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
