// Pure calendar sync logic - fully testable

export type CalendarEvent = {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
};

export type CalendarDeps = {
  googleCalendar: {
    createEvent: (event: CalendarEvent, accessToken: string) => Promise<{ id: string }>;
    updateEvent: (eventId: string, event: CalendarEvent, accessToken: string) => Promise<{ id: string }>;
    deleteEvent: (eventId: string, accessToken: string) => Promise<void>;
    refreshToken: (refreshToken: string) => Promise<{ access_token: string; expires_in: number }>;
  };
  supabase: {
    getIntegration: (userId: string) => Promise<{ access_token: string; refresh_token: string; token_expiry: string } | null>;
    updateTokens: (userId: string, accessToken: string, expiresIn: number) => Promise<void>;
  };
  userId: string;
};

export type CalendarResult = {
  success: boolean;
  eventId?: string;
  error?: {
    code: string;
    message: string;
  };
};

/**
 * Check if access token is expired
 */
export function isTokenExpired(expiryIso: string): boolean {
  const expiry = new Date(expiryIso);
  const now = new Date();
  // Consider expired if within 5 minutes of expiry
  return expiry.getTime() - now.getTime() < 5 * 60 * 1000;
}

/**
 * Get valid access token, refreshing if needed
 */
export async function getValidToken(deps: CalendarDeps): Promise<string> {
  const integration = await deps.supabase.getIntegration(deps.userId);
  
  if (!integration) {
    throw new Error('Calendar integration not found');
  }
  
  // If token is still valid, return it
  if (!isTokenExpired(integration.token_expiry)) {
    return integration.access_token;
  }
  
  // Token expired, refresh it
  const refreshed = await deps.googleCalendar.refreshToken(integration.refresh_token);
  await deps.supabase.updateTokens(deps.userId, refreshed.access_token, refreshed.expires_in);
  
  return refreshed.access_token;
}

/**
 * Create a calendar event
 */
export async function createEvent(event: CalendarEvent, deps: CalendarDeps): Promise<CalendarResult> {
  try {
    const accessToken = await getValidToken(deps);
    const result = await deps.googleCalendar.createEvent(event, accessToken);
    
    return {
      success: true,
      eventId: result.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'CREATE_FAILED',
        message: error.message || 'Failed to create calendar event',
      },
    };
  }
}

/**
 * Update an existing calendar event
 */
export async function updateEvent(eventId: string, event: CalendarEvent, deps: CalendarDeps): Promise<CalendarResult> {
  try {
    const accessToken = await getValidToken(deps);
    const result = await deps.googleCalendar.updateEvent(eventId, event, accessToken);
    
    return {
      success: true,
      eventId: result.id,
    };
  } catch (error: any) {
    return {
      success: false,
      error: {
        code: error.code || 'UPDATE_FAILED',
        message: error.message || 'Failed to update calendar event',
      },
    };
  }
}

/**
 * Delete a calendar event
 */
export async function deleteEvent(eventId: string, deps: CalendarDeps): Promise<CalendarResult> {
  try {
    const accessToken = await getValidToken(deps);
    await deps.googleCalendar.deleteEvent(eventId, accessToken);
    
    return {
      success: true,
      eventId,
    };
  } catch (error: any) {
    // 404 is acceptable for delete (already gone)
    if (error.code === 404 || error.status === 404) {
      return {
        success: true,
        eventId,
      };
    }
    
    return {
      success: false,
      error: {
        code: error.code || 'DELETE_FAILED',
        message: error.message || 'Failed to delete calendar event',
      },
    };
  }
}
