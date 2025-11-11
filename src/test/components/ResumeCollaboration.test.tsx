import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ResumeShareDialog } from '@/components/resumes/ResumeShareDialog';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(() => Promise.resolve({ 
        data: { user: { id: 'test-user' } } 
      }))
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: []
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({
        data: [{ id: '1', shared_with_email: 'test@example.com' }],
        error: null
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: null
        }))
      }))
    }))
  }
}));

describe('ResumeShareDialog', () => {
  it('renders share dialog', () => {
    const { container } = render(
      <ResumeShareDialog
        open={true}
        onOpenChange={() => {}}
        resumeId="resume-1"
      />
    );
    expect(container).toBeTruthy();
  });

  it('displays share interface', () => {
    const { container } = render(
      <ResumeShareDialog
        open={true}
        onOpenChange={() => {}}
        resumeId="resume-1"
      />
    );
    
    expect(container.textContent).toContain('Share Resume');
  });
});
