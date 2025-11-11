/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.{ts,tsx}', 'supabase/functions/**/*.ts'],
      exclude: [
        'src/**/__tests__/**',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/vite-env.d.ts',
        'src/main.tsx',
        'supabase/functions/**/index.ts',
      ],
      statements: 55,
      branches: 55,
      functions: 55,
      lines: 55,
      thresholds: {
        'src/components/jobs/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/analytics/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/automation/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/resumes/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/cover-letters/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'supabase/functions/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  },
});
