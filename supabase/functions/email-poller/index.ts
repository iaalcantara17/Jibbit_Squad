import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
  };
  internalDate: string;
}

function detectStatus(subject: string, snippet: string): string | null {
  const text = `${subject} ${snippet}`.toLowerCase();

  if (/we received your application|thanks for applying|application received/i.test(text)) {
    return 'Applied';
  }
  if (/phone screen|recruiter call|initial conversation|phone interview/i.test(text)) {
    return 'Phone Screen';
  }
  if (/interview|onsite|virtual interview|scheduled to meet/i.test(text)) {
    return 'Interview';
  }
  if (/offer|compensation package|employment offer|pleased to extend/i.test(text)) {
    return 'Offer';
  }
  if (/regret|unfortunately|not moving forward|decided to pursue|not selected/i.test(text)) {
    return 'Rejected';
  }

  return null;
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string): Promise<string> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to refresh access token');
  }

  const tokens = await tokenResponse.json();
  return tokens.access_token;
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

    // Get email integration
    const { data: integration, error: integrationError } = await supabaseClient
      .from('email_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('provider', 'google')
      .single();

    if (integrationError || !integration) {
      throw new Error('Email integration not found');
    }

    let accessToken = integration.access_token;

    // Refresh token if expired
    if (new Date(integration.expires_at) < new Date()) {
      const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

      if (!clientId || !clientSecret) {
        throw new Error('Missing OAuth configuration');
      }

      accessToken = await refreshAccessToken(integration.refresh_token, clientId, clientSecret);

      await supabaseClient
        .from('email_integrations')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + 3600 * 1000).toISOString(),
        })
        .eq('id', integration.id);
    }

    // Fetch emails from last 14 days
    const fourteenDaysAgo = Math.floor((Date.now() - 14 * 24 * 60 * 60 * 1000) / 1000);
    const query = `after:${fourteenDaysAgo}`;

    const messagesResponse = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=100`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!messagesResponse.ok) {
      throw new Error('Failed to fetch emails');
    }

    const messagesData = await messagesResponse.json();
    const messageIds = messagesData.messages || [];

    let processedCount = 0;
    let detectedCount = 0;

    // Process each message
    for (const { id } of messageIds) {
      const messageResponse = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      if (!messageResponse.ok) continue;

      const message: EmailMessage = await messageResponse.json();

      const subjectHeader = message.payload.headers.find(h => h.name.toLowerCase() === 'subject');
      const fromHeader = message.payload.headers.find(h => h.name.toLowerCase() === 'from');

      const subject = subjectHeader?.value || '';
      const fromAddr = fromHeader?.value || '';
      const snippet = message.snippet || '';

      const detectedStatus = detectStatus(subject, snippet);

      if (detectedStatus) {
        // Insert into email_tracking (idempotent via unique constraint)
        const { error: trackingError } = await supabaseClient
          .from('email_tracking')
          .insert({
            user_id: user.id,
            provider_msg_id: message.id,
            detected_status: detectedStatus,
            subject,
            from_addr: fromAddr,
            received_at: new Date(parseInt(message.internalDate)).toISOString(),
          })
          .select()
          .single();

        if (!trackingError) {
          detectedCount++;
        }
      }

      processedCount++;
    }

    return new Response(
      JSON.stringify({ success: true, processedCount, detectedCount }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email poller error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'POLLER_FAILED',
          message: error instanceof Error ? error.message : 'Failed to poll emails',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
