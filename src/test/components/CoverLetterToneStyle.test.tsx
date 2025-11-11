import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CoverLetterToneStylePresets } from '@/components/cover-letters/CoverLetterToneStylePresets';

describe('CoverLetterToneStylePresets', () => {
  it('renders all tone presets', () => {
    const onSelect = vi.fn();
    render(<CoverLetterToneStylePresets onSelect={onSelect} />);

    expect(screen.getByText('Professional')).toBeInTheDocument();
    expect(screen.getByText('Enthusiastic')).toBeInTheDocument();
    expect(screen.getByText('Analytical')).toBeInTheDocument();
    expect(screen.getByText('Creative')).toBeInTheDocument();
    expect(screen.getByText('Confident')).toBeInTheDocument();
    expect(screen.getByText('Humble')).toBeInTheDocument();
  });

  it('calls onSelect when preset clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<CoverLetterToneStylePresets onSelect={onSelect} currentTone="professional" />);

    const creativeCard = screen.getByText('Creative').closest('div[class*="cursor-pointer"]');
    if (creativeCard) await user.click(creativeCard);

    expect(onSelect).toHaveBeenCalled();
  });

  it('highlights currently active tone', () => {
    render(<CoverLetterToneStylePresets onSelect={vi.fn()} currentTone="enthusiastic" />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });
});
