import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast, toast } from '../use-toast';
import React from 'react';

describe('useToast', () => {
  beforeEach(() => {
    // Clear any existing toasts
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.toasts.forEach((t) => result.current.dismiss(t.id));
    });
  });

  it('should initialize with empty toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toEqual([]);
  });

  it('should add a toast', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Test Toast' });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe('Test Toast');
  });

  it('should add toast with description', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({
        title: 'Success',
        description: 'Operation completed successfully',
      });
    });

    expect(result.current.toasts[0].description).toBe('Operation completed successfully');
  });

  it('should dismiss a toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const t = toast({ title: 'Test Toast' });
      toastId = t.id;
    });

    expect(result.current.toasts).toHaveLength(1);

    act(() => {
      result.current.dismiss(toastId);
    });

    // Toast should be marked as not open
    expect(result.current.toasts[0].open).toBe(false);
  });

  it('should limit number of toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      // Add more than the limit
      for (let i = 0; i < 3; i++) {
        toast({ title: `Toast ${i}` });
      }
    });

    // Should only keep the most recent toast based on limit
    expect(result.current.toasts.length).toBeLessThanOrEqual(1);
  });

  it('should update an existing toast', () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;
    act(() => {
      const t = toast({ title: 'Original Title' });
      toastId = t.id;
    });

    act(() => {
      toast({
        id: toastId,
        title: 'Updated Title',
      } as any);
    });

    expect(result.current.toasts[0].title).toBe('Updated Title');
  });

  it('should dismiss all toasts', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Toast 1' });
      toast({ title: 'Toast 2' });
    });

    expect(result.current.toasts.length).toBeGreaterThan(0);

    act(() => {
      result.current.dismiss();
    });

    // All toasts should be marked as not open
    result.current.toasts.forEach((t) => {
      expect(t.open).toBe(false);
    });
  });

  it('should handle toast with action', () => {
    const { result } = renderHook(() => useToast());

    const actionLabel = 'Undo';
    act(() => {
      toast({
        title: 'Item deleted',
        action: <button>{actionLabel}</button>,
      });
    });

    expect(result.current.toasts[0].action).toBeDefined();
  });

  it('should auto-generate toast ID if not provided', () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      toast({ title: 'Test' });
    });

    expect(result.current.toasts[0].id).toBeDefined();
    expect(typeof result.current.toasts[0].id).toBe('string');
  });
});
