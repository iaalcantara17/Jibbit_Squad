import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { encryptToken } from '../_shared/encryption.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Parse query parameters from URL
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const stateParam = url.searchParams.get('state');
    const errorParam = url.searchParams.get('error');

    // Decode state which may contain JSON with user_id and app_origin
    let user_id: string | null = null;
    let app_origin: string | null = null;
    if (stateParam) {
      try {
        const decoded = JSON.parse(atob(stateParam));
        user_id = decoded?.user_id ?? null;
        app_origin = decoded?.app_origin ?? null;
      } catch {
        // Backward compatibility: state was just user_id
        user_id = stateParam;
      }
    }

    const defaultRedirectBase = (Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')) || '';
    const redirectBase = app_origin || defaultRedirectBase;

    if (errorParam) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${redirectBase}/email/callback?error=${encodeURIComponent(errorParam)}` },
      });
    }

    if (!code || !user_id) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${redirectBase}/email/callback?error=${encodeURIComponent('Missing required parameters')}` },
      });
    }

    // Create admin client to store integration
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const redirectUri = `${supabaseUrl}/functions/v1/email-oauth-callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Missing OAuth configuration');
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      throw new Error('Failed to exchange authorization code');
    }

    const tokens = await tokenResponse.json();

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(tokens.access_token);
    const encryptedRefreshToken = await encryptToken(tokens.refresh_token);

    // Store encrypted tokens in email_integrations
    const { error: dbError } = await supabaseClient
      .from('email_integrations')
      .upsert({
        user_id: user_id,
        provider: 'google',
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      }, {
        onConflict: 'user_id,provider',
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store integration');
    }

    // Redirect back to the app with success
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${redirectBase}/email/callback?success=true`,
      },
    });
  } catch (error) {
    console.error('Email OAuth callback error:', error);
    // Attempt a friendly redirect if possible
    try {
      const url = new URL(req.url);
      const stateParam = url.searchParams.get('state');
      let app_origin: string | null = null;
      if (stateParam) {
        try {
          const decoded = JSON.parse(atob(stateParam));
          app_origin = decoded?.app_origin ?? null;
        } catch {}
      }
      const defaultRedirectBase = (Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com')) || '';
      const redirectBase = app_origin || defaultRedirectBase;
      const message = error instanceof Error ? error.message : 'OAuth callback failed';
      return new Response(null, {
        status: 302,
        headers: { Location: `${redirectBase}/email/callback?error=${encodeURIComponent(message)}` },
      });
    } catch {
      return new Response(
        JSON.stringify({
          error: {
            code: 'OAUTH_CALLBACK_FAILED',
            message: error instanceof Error ? error.message : 'OAuth callback failed',
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  }
});
