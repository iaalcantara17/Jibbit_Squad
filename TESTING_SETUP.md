# Testing Setup and Coverage

## Quick Start

### Run Tests Locally

```bash
# Run all tests
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run only Sprint 3 tests with coverage
npm run test:coverage:sprint3

# Run tests with UI
npm run test:ui
```

### Required package.json Scripts

Add these scripts to your `package.json` if they don't exist:

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest run --coverage",
    "test:coverage:sprint3": "vitest run --coverage --reporter=verbose src/test/sprint3",
    "test:ui": "vitest --ui"
  }
}
```

## Coverage Reports

### Where Coverage is Generated

Coverage reports are created in the `./coverage` directory:

- **`coverage/index.html`** - Main interactive HTML report (open in browser)
- **`coverage/lcov.info`** - LCOV format for CI/CD integration
- **`coverage/lcov-report/`** - Detailed per-file HTML breakdown

### Viewing Coverage Reports

```bash
# Generate coverage
npm run test:coverage

# Open HTML report (macOS)
open coverage/index.html

# Open HTML report (Linux)
xdg-open coverage/index.html

# Open HTML report (Windows)
start coverage/index.html
```

## Coverage Thresholds

### Exact Threshold Logic

The project enforces different coverage thresholds for legacy vs. Sprint 3 code:

#### Global Thresholds (Legacy Code)
```javascript
statements: 55%
branches: 55%
functions: 55%
lines: 55%
```

#### Sprint 3 Module Thresholds (≥90% ENFORCED)

The following paths **must** maintain **90% coverage**:

**Components:**
- `src/components/interviews/**` - All interview-related components
- `src/components/mentor/**` - Mentor dashboard and feedback components
- `src/components/teams/**` - Team management components
- `src/components/documents/**` - Document sharing components
- `src/components/progress/**` - Progress sharing components

**Hooks:**
- `src/hooks/useInterviewChecklists.ts`
- `src/hooks/useInterviewFollowups.ts`
- `src/hooks/useInterviews.ts`
- `src/hooks/useTeamRole.ts`

**API Utilities:**
- `src/lib/api/interviews.ts`

**Edge Functions:**
- `supabase/functions/**` - All edge functions (90% enforced)

#### Configuration

The thresholds are defined in `vitest.config.ts`:

```typescript
coverage: {
  statements: 55,
  branches: 55,
  functions: 55,
  lines: 55,
  thresholds: {
    // Sprint 3 paths - 90% enforced
    'src/components/interviews/**': { 
      statements: 90, 
      branches: 85, 
      functions: 90, 
      lines: 90 
    },
    // ... more Sprint 3 paths
  }
}
```

### How Threshold Enforcement Works

1. **Local Development**
   ```bash
   # This command FAILS if Sprint 3 thresholds are not met
   npm run test:coverage:sprint3
   ```

2. **CI Pipeline** (`.github/workflows/test.yml`)
   - Runs automatically on push/PR
   - Executes full test suite with coverage
   - Checks Sprint 3 thresholds specifically
   - **Fails the build** if Sprint 3 coverage < 90%
   - Comments coverage diff on pull requests

3. **Enforcement Mechanism**
   - Vitest compares actual coverage against thresholds
   - If ANY Sprint 3 module falls below 90%, the test run fails
   - Legacy modules only need to meet 55% threshold
   - This allows gradual improvement without blocking all work

## CI Integration

### GitHub Actions Workflow

The `.github/workflows/test.yml` workflow:

1. **Installs dependencies** - `npm ci`
2. **Runs tests with coverage** - `npm run test:coverage`
3. **Uploads to Codecov** - Coverage tracking over time
4. **Comments on PRs** - Shows coverage diff for review
5. **Checks Sprint 3 thresholds** - `npm run test:coverage:sprint3`
6. **Archives reports** - Stores as GitHub artifacts (30 days)

### PR Coverage Comments

Every pull request automatically gets a comment with:
- Coverage percentage changes
- Files with increased/decreased coverage
- Visual indicators (🟢 increased, 🔴 decreased)
- Link to detailed coverage report

## Sprint 3 Test Coverage

### Test Files

Sprint 3 tests are located in `src/test/sprint3/`:

- **`interviewScheduling.test.ts`**
  - Interview creation and validation
  - Checklist creation and completion
  - Time calculations (duration, scheduling)
  - Status updates

- **`questionBank.test.ts`**
  - Category and difficulty filtering
  - Search functionality
  - Practice response saves
  - Response status updates
  - Time tracking

- **`mockInterviews.test.ts`**
  - Session creation
  - Response recording
  - AI feedback with fallback mode
  - Session summary calculations
  - Category scoring

- **`analyticsMetrics.test.ts`**
  - Interview success metrics
  - Application metrics
  - Goal progress calculations
  - Networking ROI
  - Time investment tracking
  - Salary progression

- **`teamPermissions.test.ts`**
  - Role validation (admin, mentor, candidate)
  - Permission enforcement
  - Team membership queries
  - Document sharing permissions
  - Progress sharing scopes

### Running Sprint 3 Tests Only

```bash
# Run all Sprint 3 tests
npm test -- src/test/sprint3

# Run specific Sprint 3 test file
npm test -- src/test/sprint3/interviewScheduling.test.ts

# Run with coverage enforcement
npm run test:coverage:sprint3
```

## Troubleshooting

### Tests Fail with "Coverage threshold not met"

1. **Identify the failing module**
   ```bash
   npm run test:coverage:sprint3
   # Look for red output showing which files failed
   ```

2. **View detailed coverage**
   ```bash
   npm run test:coverage
   open coverage/index.html
   # Navigate to the failing file
   # Red lines are not covered, green lines are covered
   ```

3. **Add tests for uncovered code**
   - Focus on business logic and critical paths
   - Add tests to appropriate file in `src/test/sprint3/`
   - Re-run coverage to verify

### All Tests Pass but Coverage Still Fails

- Check that you're testing the right file
- Ensure mocks are not preventing code execution
- Verify test assertions actually execute the code path
- Check for unreachable code (dead branches)

### Coverage Report Not Generated

```bash
# Clear cache and regenerate
rm -rf coverage node_modules/.vitest
npm install
npm run test:coverage
```

### CI Tests Pass but Local Tests Fail

- Ensure you have latest dependencies: `npm ci`
- Check Node.js version matches CI (v20)
- Clear Jest/Vitest cache: `rm -rf node_modules/.vitest`
- Verify no `.env` conflicts

## Best Practices

### What to Test

✅ **High Priority (90% coverage target)**
- Business logic calculations
- Permission checks and access control
- Data transformations and filtering
- State management
- Critical user flows

✅ **Medium Priority**
- Component rendering variations
- User interaction handlers
- Error handling
- API integration points

❌ **Low Priority (don't spend time on)**
- Pure UI styling
- Third-party library wrappers
- Type definitions
- Configuration files

### Writing Good Tests

```typescript
describe('Feature Name', () => {
  // Group related tests
  describe('Specific Functionality', () => {
    // Clear, descriptive test names
    it('should handle expected behavior', () => {
      // Arrange: Set up test data
      const input = { userId: '123', value: 10 };
      
      // Act: Execute the function
      const result = calculateMetric(input);
      
      // Assert: Verify the result
      expect(result).toBe(20);
    });
    
    // Test edge cases
    it('should handle zero values', () => {
      const result = calculateMetric({ userId: '123', value: 0 });
      expect(result).toBe(0);
    });
  });
});
```

### Mocking Best Practices

```typescript
// Mock at the module level
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    auth: { getUser: vi.fn() }
  }
}));

// Set up mock return values in each test
it('should fetch data', async () => {
  const mockData = [{ id: '1', name: 'Test' }];
  
  vi.mocked(supabase.from).mockReturnValue({
    select: vi.fn().mockResolvedValue({ data: mockData, error: null })
  } as any);
  
  // Test code here
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
});
```

## Additional Resources

- **Vitest Documentation**: https://vitest.dev/
- **Testing Library**: https://testing-library.com/
- **Coverage Best Practices**: https://kentcdodds.com/blog/common-testing-mistakes
- **Sprint 3 Test README**: `src/test/sprint3/README.md`
