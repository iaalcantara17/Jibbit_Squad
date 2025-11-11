# Unit Testing Guide

## Overview

This project uses **Vitest** as the testing framework and **React Testing Library** for component testing. All tests are located alongside the code they test in `__tests__` directories.

## Running Tests

### Run all tests
```bash
npm run test
```

### Run tests in watch mode (recommended during development)
```bash
npm run test:watch
```

### Run tests with coverage report
```bash
npm run test:coverage
```

### Open Vitest UI (interactive test runner)
```bash
npm run test:ui
```

## Test Structure

```
src/
├── lib/
│   ├── __tests__/
│   │   ├── api.test.ts          # API client tests
│   │   └── utils.test.ts        # Utility function tests
│   ├── api.ts
│   └── utils.ts
├── contexts/
│   ├── __tests__/
│   │   └── AuthContext.test.tsx # Authentication context tests
│   └── AuthContext.tsx
├── components/
│   └── ui/
│       ├── __tests__/
│       │   ├── button.test.tsx  # Button component tests
│       │   └── input.test.tsx   # Input component tests
│       ├── button.tsx
│       └── input.tsx
└── hooks/
    ├── __tests__/
    │   └── use-toast.test.ts    # Toast hook tests
    └── use-toast.ts
```

## Coverage Goals (Sprint 1 - UC-035)

- **Target**: 90% code coverage
- **Current areas covered**:
  - ✅ Authentication (login, register, logout, delete account)
  - ✅ API client (all endpoints)
  - ✅ Profile management
  - ✅ Form components (Button, Input)
  - ✅ Utility functions
  - ✅ Toast notifications

## Writing Tests

### Test Naming Convention
- Use descriptive names: `should [expected behavior] when [condition]`
- Example: `should login successfully when credentials are valid`

### Test Structure (AAA Pattern)
```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const mockData = { ... };
  
  // Act - Execute the code
  const result = someFunction(mockData);
  
  // Assert - Verify the outcome
  expect(result).toBe(expected);
});
```

### Component Testing Example
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should handle click', () => {
    const handleClick = vi.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### API Testing Example
```typescript
import { api } from '../api';

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('should fetch data successfully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: { ... } }),
    });

    const result = await api.getData();
    expect(result.success).toBe(true);
  });
});
```

## Test Coverage Report

After running `npm run test:coverage`, open `coverage/index.html` in your browser to see a detailed coverage report showing:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

## Best Practices

1. **Test behavior, not implementation** - Focus on what the component does, not how it does it
2. **Keep tests isolated** - Each test should be independent
3. **Use meaningful assertions** - Make it clear what you're testing
4. **Mock external dependencies** - API calls, localStorage, etc.
5. **Test edge cases** - Empty states, error conditions, boundary values
6. **Keep tests simple** - One concept per test

## Common Testing Utilities

### Vitest
- `describe()` - Group related tests
- `it()` or `test()` - Individual test case
- `expect()` - Assertion
- `vi.fn()` - Create mock function
- `vi.mock()` - Mock module
- `beforeEach()`, `afterEach()` - Setup/teardown

### React Testing Library
- `render()` - Render component
- `screen` - Query rendered elements
- `fireEvent` - Simulate user interactions
- `waitFor()` - Wait for async updates
- `renderHook()` - Test custom hooks

## Debugging Tests

1. Use `console.log()` to inspect values
2. Use `screen.debug()` to see current DOM state
3. Run single test with `.only`:
   ```typescript
   it.only('should test specific case', () => { ... });
   ```
4. Skip tests with `.skip`:
   ```typescript
   it.skip('should test later', () => { ... });
   ```

## CI/CD Integration

Tests automatically run on:
- Pull requests
- Pushes to main branch
- Manual workflow dispatch

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
