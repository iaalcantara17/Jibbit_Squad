# Sprint 3 Test Coverage

This directory contains test coverage for all Sprint 3 features, enforcing 90% coverage on new modules.

## Test Files

### Core Functionality Tests
- `interviewScheduling.test.ts` - Interview creation, scheduling, and checklist logic
- `questionBank.test.ts` - Question filtering, search, and practice response saves
- `mockInterviews.test.ts` - Mock interview sessions, AI feedback with fallback mode
- `analyticsMetrics.test.ts` - Pure function calculations for all analytics metrics
- `teamPermissions.test.ts` - Role-based permission checks and access control

## Running Tests Locally

### Run all tests
```bash
npm test
```

### Run tests in watch mode (development)
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm run test:coverage
```

### Run only Sprint 3 tests
```bash
npm test -- src/test/sprint3
```

### Run Sprint 3 coverage check
```bash
npm run test:coverage:sprint3
```

## Coverage Reports

### Location
Coverage reports are generated in the `./coverage` directory:
- `coverage/index.html` - Interactive HTML report (open in browser)
- `coverage/lcov.info` - LCOV format for CI/CD tools
- `coverage/lcov-report/` - Detailed HTML breakdown by file

### Viewing Reports
```bash
# Generate coverage and open report
npm run test:coverage
open coverage/index.html
```

## Coverage Thresholds

### Global Thresholds (Legacy Code)
- Statements: 55%
- Branches: 55%
- Functions: 55%
- Lines: 55%

### Sprint 3 Module Thresholds (NEW CODE - Enforced at 90%)
The following modules must maintain 90% coverage:

**Components:**
- `src/components/interviews/**`
- `src/components/mentor/**`
- `src/components/teams/**`
- `src/components/documents/**`
- `src/components/progress/**`

**Hooks:**
- `src/hooks/useInterviewChecklists.ts`
- `src/hooks/useInterviewFollowups.ts`
- `src/hooks/useInterviews.ts`
- `src/hooks/useTeamRole.ts`

**API Utilities:**
- `src/lib/api/interviews.ts`

**Edge Functions:**
- `supabase/functions/**` (all functions)

## Threshold Enforcement

### How It Works
1. **Vitest Configuration** (`vitest.config.ts`):
   - Global thresholds apply to all code (55%)
   - Specific path thresholds override for Sprint 3 modules (90%)
   - Tests fail if any threshold is not met

2. **CI Pipeline** (`.github/workflows/test.yml`):
   - Runs on every push and pull request
   - Executes `npm run test:coverage` 
   - Uploads coverage to Codecov
   - Comments coverage diff on PRs
   - Fails build if Sprint 3 thresholds not met

3. **Local Development**:
   - Run `npm run test:coverage:sprint3` to check only Sprint 3 coverage
   - IDE integration shows coverage inline
   - Pre-commit hooks can enforce coverage (optional)

## Coverage Strategy

### What to Test
✅ **High Priority:**
- Business logic and calculations (pure functions)
- Permission checks and access control
- Data transformations and filtering
- State management logic
- Critical user flows

✅ **Medium Priority:**
- Component rendering with various props
- User interactions and event handlers
- Error handling and edge cases
- API integration points

❌ **Lower Priority:**
- UI styling and layout
- Third-party library wrappers
- Configuration files
- Type definitions

### Testing Best Practices

1. **Isolation**: Mock external dependencies (Supabase, API calls)
2. **Clarity**: One concept per test with clear descriptions
3. **Coverage**: Focus on business logic, not just line coverage
4. **Speed**: Keep tests fast (< 1s each)
5. **Reliability**: No flaky tests or timing dependencies

### Example Test Structure
```typescript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should handle expected behavior', () => {
      // Arrange: Set up test data
      const input = { ... };
      
      // Act: Execute the function
      const result = myFunction(input);
      
      // Assert: Verify the result
      expect(result).toBe(expected);
    });
  });
});
```

## Continuous Improvement

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts` or `*.test.tsx`
3. Ensure tests are isolated and fast
4. Run coverage to verify thresholds
5. Update this README if adding new patterns

### Investigating Coverage Gaps
```bash
# Generate coverage report
npm run test:coverage

# Open HTML report
open coverage/index.html

# Find untested lines (marked in red)
# Add tests for critical paths first
```

### Debugging Failed Tests
```bash
# Run specific test file
npm test -- src/test/sprint3/interviewScheduling.test.ts

# Run tests with verbose output
npm test -- --reporter=verbose

# Run tests in watch mode (reruns on file changes)
npm run test:watch
```

## CI Integration

### GitHub Actions Workflow
The `.github/workflows/test.yml` file:
1. Installs dependencies
2. Runs all tests with coverage
3. Uploads coverage to Codecov
4. Comments coverage diff on PRs
5. Checks Sprint 3 thresholds specifically
6. Archives coverage reports as artifacts

### Coverage on Pull Requests
- Coverage report is automatically commented on PRs
- Shows coverage diff compared to base branch
- Highlights newly added/removed coverage
- Fails if Sprint 3 thresholds not met

## Troubleshooting

### Tests Won't Run
```bash
# Clear cache and reinstall
rm -rf node_modules coverage
npm install
npm test
```

### Coverage Thresholds Failing
1. Check `coverage/index.html` to see which files
2. Add tests for uncovered code paths
3. Focus on Sprint 3 modules if that's what's failing
4. Run `npm run test:coverage:sprint3` to isolate issues

### Slow Tests
- Check for unintentional timeouts or delays
- Mock expensive operations
- Use `vi.useFakeTimers()` for time-based tests
- Consider splitting large test files

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Coverage Best Practices](https://kentcdodds.com/blog/common-testing-mistakes)
