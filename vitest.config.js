import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.js'],
    // Shared helpers imported by other tests, not a suite
    exclude: ['test/common.js'],
    // Live Play Store requests: one file at a time reduces rate-limit flakiness
    fileParallelism: false,
    testTimeout: 5000,
    hookTimeout: 5000,
  },
});
