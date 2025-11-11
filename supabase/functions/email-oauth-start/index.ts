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
    // Try to read user_id and optional email from request body, but allow empty body for config probe
    let user_id: string | null = null;
    let email: string | null = null;
    try {
      const body = await req.json();
      user_id = body?.user_id ?? null;
      email = body?.email ?? null;
    } catch {
      // No JSON body provided - treat as config probe
    }
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;

    if (!clientId) {
      // Return 200 with configured=false so the UI can disable the button gracefully
      return new Response(
        JSON.stringify({ configured: false, reason: 'OAuth credentials not configured' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If no user_id, this is a configuration probe - return configured=true
    if (!user_id) {
      return new Response(
        JSON.stringify({ configured: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
    ];

    // Build state with user_id and app origin for reliable redirect later
    const appOrigin = req.headers.get('origin') || null;
    const statePayload = { user_id, app_origin: appOrigin };
    const state = btoa(JSON.stringify(statePayload));

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    if (email) {
      params.set('login_hint', email);
    }

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
