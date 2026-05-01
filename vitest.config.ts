import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'main',
          environment: 'node',
          include: ['tests/main/**/*.test.ts']
        }
      },
      {
        test: {
          name: 'renderer',
          environment: 'jsdom',
          include: ['tests/renderer/**/*.test.ts', 'tests/renderer/**/*.test.tsx']
        }
      }
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/renderer/main.tsx', 'node_modules', 'out']
    }
  }
});
