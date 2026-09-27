import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@sysiphus/contracts': fileURLToPath(new URL('./packages/contracts/src/index.ts', import.meta.url)),
      '@sysiphus/metrics': fileURLToPath(new URL('./packages/metrics/src/index.ts', import.meta.url)),
      '@sysiphus/client': fileURLToPath(new URL('./packages/client/src/index.ts', import.meta.url)),
      '@sysiphus/cli': fileURLToPath(new URL('./packages/cli/src/index.ts', import.meta.url))
    }
  },
  test: { include: ['tests/**/*.test.ts', 'packages/*/tests/**/*.test.ts'], testTimeout: 10000 }
});
