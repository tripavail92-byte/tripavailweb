/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-unused-vars */
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
const [providerId, status] = process.argv.slice(2);
if (!providerId || !status) {
  console.error('Usage: node force-provider-status.js <providerId> <STATUS>');
  process.exit(1);
}
(async () => {
  const now = new Date();
  const provider = await p.providerProfile.update({
    where: { id: providerId },
    data: {
      verificationStatus: status,
      // verifiedAt exists on schema; reviewer/rejection fields do not in the current DB
      verifiedAt: status === 'APPROVED' ? now : null,
    },
  });
  await p.providerOnboarding.updateMany({
    where: { providerId },
    data: {
      submittedAt: now,
      approvedAt: status === 'APPROVED' ? now : null,
      rejectedAt: status === 'REJECTED' ? now : null,
    },
  });
  console.log('Updated', providerId, '->', status);
  await p.$disconnect();
})();
