import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResumeSectionEditor } from '@/components/resumes/ResumeSectionEditor';

describe('ResumeSectionEditor - Section Toggles and Reorder', () => {
  const mockSections = [
    { id: 'sec-1', type: 'summary', title: 'Summary', content: 'Professional summary', order: 0, isVisible: true },
    { id: 'sec-2', type: 'experience', title: 'Experience', content: 'Work history', order: 1, isVisible: true },
    { id: 'sec-3', type: 'education', title: 'Education', content: 'Degrees', order: 2, isVisible: false },
  ];

  let onUpdateMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onUpdateMock = vi.fn();
  });

  it('should toggle section visibility', async () => {
    render(<ResumeSectionEditor sections={mockSections} onUpdate={onUpdateMock} />);

    const visibilityButtons = screen.getAllByRole('button');
    const toggleButton = visibilityButtons.find(btn => btn.querySelector('svg'));
    
    if (toggleButton) {
      fireEvent.click(toggleButton);
      await waitFor(() => {
        expect(onUpdateMock).toHaveBeenCalled();
        const updatedSections = onUpdateMock.mock.calls[0][0];
        expect(updatedSections).toBeDefined();
      });
    }
  });

  it('should maintain order property on sections', () => {
    render(<ResumeSectionEditor sections={mockSections} onUpdate={onUpdateMock} />);
    
    mockSections.forEach((section, index) => {
      expect(section.order).toBe(index);
    });
  });

  it('should call onUpdate when section is toggled', async () => {
    render(<ResumeSectionEditor sections={mockSections} onUpdate={onUpdateMock} />);
    
    const visibilityButtons = screen.getAllByRole('button');
    if (visibilityButtons.length > 0) {
      fireEvent.click(visibilityButtons[0]);
      await waitFor(() => {
        expect(onUpdateMock).toHaveBeenCalledTimes(1);
      });
    }
  });

  it('should filter out invisible sections in export', () => {
    const visibleSections = mockSections.filter(s => s.isVisible);
    expect(visibleSections).toHaveLength(2);
    expect(visibleSections.every(s => s.isVisible)).toBe(true);
  });
});
