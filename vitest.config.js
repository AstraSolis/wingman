import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js', 'src/**/*.jsx', 'preload.js'],
      exclude: ['src/renderer/main.jsx', 'node_modules', 'dist']
    }
  }
});
