# Current Sprint Test Suite

This directory contains the clean, minimal test suite for the current sprint requirements.

## Test Organization

- **auth-provider.test.tsx**: Tests for authentication provider integration and mocking
- **jobs-happy-path.test.tsx**: Core job management happy-path scenarios
- **analytics-calculations.test.ts**: Pure function tests for analytics metrics
- **automation-rule-logic.test.ts**: Logic tests for automation rules (no UI dependencies)

## Running Tests

```bash
# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
```

## Test Utilities

Located in `src/test/utils/`:

- **renderWithProviders.tsx**: Helper to render components with all required providers (Auth, Router, QueryClient)
- **mockSupabase.ts**: Utilities for mocking Supabase client responses

## Guidelines

1. **Keep tests deterministic**: No real API calls, no timers, no random data
2. **Mock at the boundary**: Mock Supabase client, not internal functions
3. **Test behavior, not implementation**: Focus on user-facing outcomes
4. **Use setup.ts mocks**: ResizeObserver, matchMedia, localStorage are globally mocked

## Coverage Requirements

Coverage thresholds are defined in `vitest.config.ts`. Current sprint focuses on:
- Core job management components
- Analytics calculations
- Automation logic

Non-critical paths and UI-only components have lower thresholds.
