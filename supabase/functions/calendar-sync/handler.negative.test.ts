import { describe, it, expect, vi } from 'vitest';
import { deleteEvent, createEvent } from './handler.ts';
import type { CalendarDeps } from './handler.ts';

describe('calendar-sync handler - Negative Paths', () => {
  it('handles 404 on delete (already gone) as success', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn().mockRejectedValue({ code: 404, message: 'Not found' }),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await deleteEvent('event-404', deps);

    expect(result.success).toBe(true);
    expect(result.eventId).toBe('event-404');
  });

  it('normalizes other delete errors to error JSON', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn().mockRejectedValue({ code: 500, message: 'Server error' }),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await deleteEvent('event-fail', deps);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(500);
    expect(result.error?.message).toBe('Server error');
  });

  it('refreshes token on 401 and retries create', async () => {
    let attemptCount = 0;
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn().mockImplementation(() => {
          attemptCount++;
          if (attemptCount === 1) {
            return Promise.reject({ code: 401, message: 'Unauthorized' });
          }
          return Promise.resolve({ id: 'event-created' });
        }),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
        refreshToken: vi.fn().mockResolvedValue({
          access_token: 'new-token',
          expires_in: 3600,
        }),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'expired-token',
          refresh_token: 'refresh',
          token_expiry: new Date(Date.now() - 1000).toISOString(), // Expired
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await createEvent(
      {
        summary: 'Test Event',
        start: { dateTime: '2025-01-15T10:00:00Z', timeZone: 'UTC' },
        end: { dateTime: '2025-01-15T11:00:00Z', timeZone: 'UTC' },
      },
      deps
    );

    expect(result.success).toBe(true);
    expect(result.eventId).toBe('event-created');
    expect(deps.supabase.updateTokens).toHaveBeenCalledWith('user-123', 'new-token', 3600);
  });
});
