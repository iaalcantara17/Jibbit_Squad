import { describe, it, expect, vi } from 'vitest';
import {
  isTokenExpired,
  getValidToken,
  createEvent,
  updateEvent,
  deleteEvent,
  type CalendarDeps,
  type CalendarEvent,
} from './handler.ts';

describe('isTokenExpired', () => {
  it('returns true if token expired', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
    expect(isTokenExpired(pastDate)).toBe(true);
  });

  it('returns true if token expires within 5 minutes', () => {
    const soonDate = new Date(Date.now() + 4 * 60 * 1000).toISOString(); // 4 minutes
    expect(isTokenExpired(soonDate)).toBe(true);
  });

  it('returns false if token valid for more than 5 minutes', () => {
    const futureDate = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes
    expect(isTokenExpired(futureDate)).toBe(false);
  });
});

describe('getValidToken', () => {
  it('returns existing token if not expired', async () => {
    const futureExpiry = new Date(Date.now() + 3600000).toISOString();
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          token_expiry: futureExpiry,
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const token = await getValidToken(deps);

    expect(token).toBe('valid-token');
    expect(deps.googleCalendar.refreshToken).not.toHaveBeenCalled();
  });

  it('refreshes token if expired', async () => {
    const pastExpiry = new Date(Date.now() - 3600000).toISOString();
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
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
          refresh_token: 'refresh-token',
          token_expiry: pastExpiry,
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const token = await getValidToken(deps);

    expect(token).toBe('new-token');
    expect(deps.googleCalendar.refreshToken).toHaveBeenCalledWith('refresh-token');
    expect(deps.supabase.updateTokens).toHaveBeenCalledWith('user-123', 'new-token', 3600);
  });

  it('throws if integration not found', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue(null),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    await expect(getValidToken(deps)).rejects.toThrow('Calendar integration not found');
  });
});

describe('createEvent', () => {
  const mockEvent: CalendarEvent = {
    summary: 'Interview with TechCorp',
    location: 'https://zoom.us/j/123',
    start: {
      dateTime: '2024-02-01T14:00:00Z',
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: '2024-02-01T15:00:00Z',
      timeZone: 'America/New_York',
    },
  };

  it('creates event successfully', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn().mockResolvedValue({ id: 'event-123' }),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await createEvent(mockEvent, deps);

    expect(result).toEqual({
      success: true,
      eventId: 'event-123',
    });
    expect(deps.googleCalendar.createEvent).toHaveBeenCalledWith(mockEvent, 'valid-token');
  });

  it('handles creation errors', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn().mockRejectedValue(new Error('Calendar API error')),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn(),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await createEvent(mockEvent, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: 'Calendar API error',
      },
    });
  });
});

describe('updateEvent', () => {
  const mockEvent: CalendarEvent = {
    summary: 'Updated Interview',
    start: {
      dateTime: '2024-02-01T15:00:00Z',
      timeZone: 'America/New_York',
    },
    end: {
      dateTime: '2024-02-01T16:00:00Z',
      timeZone: 'America/New_York',
    },
  };

  it('updates event successfully', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
        updateEvent: vi.fn().mockResolvedValue({ id: 'event-123' }),
        deleteEvent: vi.fn(),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await updateEvent('event-123', mockEvent, deps);

    expect(result).toEqual({
      success: true,
      eventId: 'event-123',
    });
  });

  it('handles update errors', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
        updateEvent: vi.fn().mockRejectedValue({ code: 404, message: 'Event not found' }),
        deleteEvent: vi.fn(),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await updateEvent('event-123', mockEvent, deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 404,
        message: 'Event not found',
      },
    });
  });
});

describe('deleteEvent', () => {
  it('deletes event successfully', async () => {
    const deps: CalendarDeps = {
      googleCalendar: {
        createEvent: vi.fn(),
        updateEvent: vi.fn(),
        deleteEvent: vi.fn().mockResolvedValue(undefined),
        refreshToken: vi.fn(),
      },
      supabase: {
        getIntegration: vi.fn().mockResolvedValue({
          access_token: 'valid-token',
          refresh_token: 'refresh-token',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await deleteEvent('event-123', deps);

    expect(result).toEqual({
      success: true,
      eventId: 'event-123',
    });
  });

  it('treats 404 as success (event already deleted)', async () => {
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
          refresh_token: 'refresh-token',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await deleteEvent('event-123', deps);

    expect(result).toEqual({
      success: true,
      eventId: 'event-123',
    });
  });

  it('handles other delete errors', async () => {
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
          refresh_token: 'refresh-token',
          token_expiry: new Date(Date.now() + 3600000).toISOString(),
        }),
        updateTokens: vi.fn(),
      },
      userId: 'user-123',
    };

    const result = await deleteEvent('event-123', deps);

    expect(result).toEqual({
      success: false,
      error: {
        code: 500,
        message: 'Server error',
      },
    });
  });
});
