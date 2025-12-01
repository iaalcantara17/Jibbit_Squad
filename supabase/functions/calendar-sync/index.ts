import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { decryptToken, encryptToken } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarEvent {
  interviewId: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { action, event } = await req.json();

    // Get user's calendar integration
    const { data: integration } = await supabaseClient
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (!integration || !integration.access_token) {
      return new Response(
        JSON.stringify({ error: 'Calendar not connected' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Decrypt the access token
    let accessToken = await decryptToken(integration.access_token);

    // Check if token is expired and refresh if needed
    if (integration.token_expiry && new Date(integration.token_expiry) < new Date()) {
      const decryptedRefreshToken = await decryptToken(integration.refresh_token);
      
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('GOOGLE_CALENDAR_CLIENT_ID') || '',
          client_secret: Deno.env.get('GOOGLE_CALENDAR_CLIENT_SECRET') || '',
          refresh_token: decryptedRefreshToken,
          grant_type: 'refresh_token',
        }),
      });

      const refreshData = await refreshResponse.json();
      accessToken = refreshData.access_token;

      // Encrypt new access token before storing
      const encryptedAccessToken = await encryptToken(accessToken);

      // Update token in database
      await supabaseClient
        .from('calendar_integrations')
        .update({
          access_token: encryptedAccessToken,
          token_expiry: new Date(Date.now() + refreshData.expires_in * 1000).toISOString(),
        })
        .eq('id', integration.id);
    }

    if (action === 'create') {
      const calendarEvent: CalendarEvent = event;

      const googleEvent = {
        summary: calendarEvent.title,
        description: calendarEvent.description,
        location: calendarEvent.location,
        start: {
          dateTime: calendarEvent.startTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: calendarEvent.endTime,
          timeZone: 'UTC',
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 60 },
          ],
        },
      };

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(googleEvent),
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Google Calendar API error:', errorData);
        throw new Error(`Failed to create calendar event: ${response.status}`);
      }

      const createdEvent = await response.json();

      // Update interview with calendar event ID
      await supabaseClient
        .from('interviews')
        .update({ calendar_event_id: createdEvent.id })
        .eq('id', calendarEvent.interviewId);

      return new Response(
        JSON.stringify({ success: true, eventId: createdEvent.id, eventLink: createdEvent.htmlLink }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (action === 'delete') {
      const { eventId } = event;

      await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return new Response(
        JSON.stringify({ success: true }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Calendar sync error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
