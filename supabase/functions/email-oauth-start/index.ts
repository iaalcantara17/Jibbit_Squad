import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;

    if (!clientId) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'OAUTH_NOT_CONFIGURED',
            message: 'OAuth credentials not configured. Please contact support.',
          },
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;

    return new Response(
      JSON.stringify({ authUrl }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Email OAuth start error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'OAUTH_START_FAILED',
          message: error instanceof Error ? error.message : 'Failed to start OAuth flow',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
