/// <reference types="vitest/config" />
import { defineConfig } from 'vitest/config';
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
        // Sprint 3 Coverage Thresholds - Enforced at 90%
        'src/components/interviews/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/mentor/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/teams/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/documents/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/progress/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/peer/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/institutional/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/components/advisor/**': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/hooks/useInterviewChecklists.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/hooks/useInterviewFollowups.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/hooks/useInterviews.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/hooks/useTeamRole.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/lib/api/interviews.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/lib/demo/seedSprint3Data.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
        'src/lib/demo/sprint3DemoActions.ts': { statements: 90, branches: 85, functions: 90, lines: 90 },
      },
    },
  },
});
