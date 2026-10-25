import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.js'],
    env: {
      DB_PATH: ':memory:', // database sementara; data asli tidak tersentuh
      JWT_SECRET: 'rahasia-khusus-pengujian',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.js'],
      exclude: ['src/**/*.test.js', 'src/test-utils.js'],
    },
  },
});
