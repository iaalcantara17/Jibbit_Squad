import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID');
    if (!clientId) {
      throw new Error('LINKEDIN_CLIENT_ID not configured');
    }

    const url = new URL(req.url);
    const redirectTo = url.searchParams.get('redirect_to') || '';
    
    // Get the origin for the callback URL
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const callbackUrl = `${supabaseUrl}/functions/v1/linkedin-oauth-callback`;
    
    // Store the redirect URL in state parameter (base64 encoded)
    const state = btoa(JSON.stringify({ redirect_to: redirectTo }));
    
    // LinkedIn OAuth 2.0 authorization URL (OpenID Connect)
    const linkedInAuthUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
    linkedInAuthUrl.searchParams.set('response_type', 'code');
    linkedInAuthUrl.searchParams.set('client_id', clientId);
    linkedInAuthUrl.searchParams.set('redirect_uri', callbackUrl);
    linkedInAuthUrl.searchParams.set('state', state);
    linkedInAuthUrl.searchParams.set('scope', 'openid profile email');

    console.log('LinkedIn OAuth start - redirecting to:', linkedInAuthUrl.toString());

    return new Response(null, {
      status: 302,
      headers: {
        ...corsHeaders,
        'Location': linkedInAuthUrl.toString(),
      },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('LinkedIn OAuth start error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
