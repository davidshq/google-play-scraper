import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.js'],
    // Shared helpers / fixtures imported by suites, not suites themselves
    exclude: ['test/common.js', 'test/fixtures/**'],
    // Live Play Store requests: one file at a time reduces rate-limit flakiness
    fileParallelism: false,
    testTimeout: 5000,
    hookTimeout: 5000,
  },
});
