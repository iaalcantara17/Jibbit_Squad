# Sprint 3 Tests (UC-074 through UC-116)

This directory contains unit tests for Sprint 3 features.

## Test Organization

Tests are organized by use case (UC) for traceability:

### Interview Prep (UC-074 to UC-085)
- `uc074-question-bank.test.tsx` - Question bank browsing, filtering, search
- `uc075-practice-tracking.test.tsx` - Practice response tracking, history
- `uc076-mock-interviews.test.tsx` - Mock interview sessions and summaries
- `uc077-ai-feedback.test.tsx` - AI/rules-based feedback generation
- `uc079-company-research.test.tsx` - Company research report generation
- `uc081-checklist.test.tsx` - Interview preparation checklists
- `uc082-followup.test.tsx` - Follow-up template generation
- `uc083-reminders.test.tsx` - Interview reminder system
- `uc085-technical-prep.test.tsx` - Technical challenge practice

### Network (UC-086 to UC-095)
- `uc086-contacts.test.tsx` - Contact management CRUD operations
- `uc087-referrals.test.tsx` - Referral request management
- `uc088-events.test.tsx` - Networking events management
- `uc090-informational.test.tsx` - Informational interview tracking
- `uc091-relationship.test.tsx` - Relationship maintenance reminders
- `uc092-discovery.test.tsx` - Contact discovery and import
- `uc093-templates.test.tsx` - LinkedIn message templates
- `uc094-references.test.tsx` - Reference manager
- `uc095-campaigns.test.tsx` - Networking campaign tracking

### Analytics (UC-096 to UC-107)
- `uc097-funnel.test.tsx` - Application funnel visualization
- `uc098-time-to-offer.test.tsx` - Time-to-offer calculations
- `uc100-network-roi.test.tsx` - Network ROI analytics
- `uc101-salary.test.tsx` - Salary progression tracking
- `uc102-reports.test.tsx` - Custom report builder
- `uc103-forecasting.test.tsx` - Predictive forecasting
- `uc104-market.test.tsx` - Market intelligence
- `uc105-benchmarking.test.tsx` - Benchmarking analytics
- `uc107-patterns.test.tsx` - Success pattern analysis

### Collaboration (UC-108 to UC-111)
- `uc108-teams.test.tsx` - Team collaboration features
- `uc110-mentor.test.tsx` - Mentor-mentee workflow
- `uc111-progress.test.tsx` - Progress sharing

### Advanced Features (UC-112 to UC-116)
- `uc112-peer.test.tsx` - Peer networking and support groups
- `uc113-family.test.tsx` - Family support integration
- `uc114-institutional.test.tsx` - Institutional/corporate integration
- `uc115-advisor.test.tsx` - External advisor/coach integration

### Existing Tests (migrated from sprint_current)
- `analytics-calculations.test.ts` - Analytics metric calculations
- `automation-rule-logic.test.ts` - Automation rule execution logic
- `auth-provider.test.tsx` - Authentication provider testing utilities
- `jobs-happy-path.test.tsx` - Jobs feature happy path tests

## Running Tests

```bash
# Run all Sprint 3 tests
npm test src/test/sprint3

# Run specific test file
npm test src/test/sprint3/uc112-peer.test.tsx

# Run with coverage
npm run test:coverage

# Run in watch mode
npm test -- --watch src/test/sprint3
```

## Coverage Requirements

Sprint 3 paths must meet these thresholds (enforced by vitest.config.ts):
- **Statements:** ≥90%
- **Branches:** ≥85%
- **Functions:** ≥90%
- **Lines:** ≥90%

Paths covered:
- `src/components/peer/**`
- `src/components/institutional/**`
- `src/components/advisor/**`
- `src/components/family/**`
- `src/components/interviews/**`
- `src/components/network/**`
- `src/components/analytics/**`
- `src/components/automation/**`
- `src/components/mentor/**`
- `src/components/teams/**`
- `src/components/documents/**`
- `src/components/progress/**`

## Test Structure

Follow this pattern for new tests:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/renderWithProviders';

describe('UC-XXX: Feature Name', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Acceptance Criterion 1', () => {
    it('should perform specific behavior', async () => {
      // Arrange
      const mockData = { /* ... */ };
      
      // Act
      const { getByTestId } = renderWithProviders(<Component />);
      
      // Assert
      expect(getByTestId('element')).toBeInTheDocument();
    });
  });
});
```

## Mocking Guidelines

- Use `renderWithProviders` from `../utils/renderWithProviders` for components needing auth/routing
- Mock Supabase calls using `vi.mock('@/integrations/supabase/client')`
- Keep tests deterministic - no network calls, no timeouts
- Mock edge function responses consistently

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Test Setup](../setup.ts)
- [Render Utilities](../utils/renderWithProviders.tsx)
