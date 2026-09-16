import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@opengeo/contracts': fileURLToPath(new URL('./packages/contracts/src/index.ts', import.meta.url)),
      '@opengeo/metrics': fileURLToPath(new URL('./packages/metrics/src/index.ts', import.meta.url)),
      '@opengeo/client': fileURLToPath(new URL('./packages/client/src/index.ts', import.meta.url))
    }
  },
  test: { include: ['tests/**/*.test.ts', 'packages/*/tests/**/*.test.ts'], testTimeout: 10000 }
});
