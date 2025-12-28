import { execSync } from 'child_process';
import path from 'path';

export default async function globalSetup() {
  // Ensure a known-good baseline for E2E tests.
  // The seed script clears all data and recreates deterministic fixtures.
  const backendDir = path.resolve(__dirname, '..');

  execSync('node -r ts-node/register -r tsconfig-paths/register prisma/seed.ts', {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      // keep seed reasonably fast and avoid typecheck overhead
      TS_NODE_TRANSPILE_ONLY: '1',
    },
  });
}
