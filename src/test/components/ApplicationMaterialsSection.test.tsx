import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { ApplicationMaterialsSection } from '@/components/jobs/ApplicationMaterialsSection';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    resumes: { getAll: vi.fn() },
    coverLetters: { getAll: vi.fn() },
    materialsUsage: { add: vi.fn() },
    auth: { getUser: vi.fn() },
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe('ApplicationMaterialsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.resumes.getAll as any).mockResolvedValue([{ id: 'r1', title: 'Resume 1' }]);
    (api.coverLetters.getAll as any).mockResolvedValue([{ id: 'c1', title: 'CL 1' }]);
    (api.auth.getUser as any).mockResolvedValue({ data: { user: { id: 'user1' } } });
    (api.materialsUsage.add as any).mockResolvedValue({ id: 'usage1' });
  });

  it('renders materials selection', () => {
    render(<ApplicationMaterialsSection jobId="job1" onUpdate={vi.fn()} />);
    expect(screen.getByText(/resume/i)).toBeDefined();
  });
});
