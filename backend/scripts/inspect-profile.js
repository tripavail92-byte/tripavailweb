/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const ids = [
    ['traveler_smoke_1', 'HOTEL_MANAGER'],
    ['traveler_smoke_1', 'TOUR_OPERATOR'],
  ];
  for (const [userId, providerType] of ids) {
    const profile = await p.providerProfile.findUnique({
      where: { userId_providerType: { userId, providerType } },
      include: { onboarding: true },
    });
    console.log('---', userId, providerType);
    console.log(JSON.stringify(profile, null, 2));
  }
  await p.$disconnect();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
