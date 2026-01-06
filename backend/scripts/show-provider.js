/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const userId = process.argv[2];
const providerType = process.argv[3];
if (!userId) {
  console.error('Usage: node scripts/show-provider.js <userId> [providerType]');
  process.exit(1);
}

const p = new PrismaClient();
(async () => {
  const res = await p.providerProfile.findMany({ where: { userId }, include: { onboarding: true } });
  console.log(JSON.stringify(res, null, 2));
  if (providerType) {
    const uniq = await p.providerProfile.findUnique({
      where: { userId_providerType: { userId, providerType } },
      include: { onboarding: true },
    });
    console.log('findUnique result:', JSON.stringify(uniq, null, 2));
  }
  await p.$disconnect();
})().catch(async (err) => {
  console.error(err);
  await p.$disconnect();
  process.exit(1);
});
