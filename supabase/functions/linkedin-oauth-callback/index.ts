import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Parse state to get redirect URL
    let redirectTo = '';
    try {
      const stateData = JSON.parse(atob(state || ''));
      redirectTo = stateData.redirect_to || '';
    } catch {
      console.log('Could not parse state parameter');
    }

    // Default redirect if none specified
    const baseRedirect = redirectTo || Deno.env.get('SITE_URL') || 'https://jibbit.app';

    if (error) {
      console.error('LinkedIn OAuth error:', error, errorDescription);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `${baseRedirect}/auth/callback?error=${encodeURIComponent(errorDescription || error)}`,
        },
      });
    }

    if (!code) {
      throw new Error('No authorization code received');
    }

    const clientId = Deno.env.get('LINKEDIN_CLIENT_ID');
    const clientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!clientId || !clientSecret) {
      throw new Error('LinkedIn credentials not configured');
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/linkedin-oauth-callback`;

    // Exchange code for access token
    console.log('Exchanging code for access token...');
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: callbackUrl,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error(`Token exchange failed: ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    console.log('Token exchange successful');

    // Get user info using the access token (OpenID Connect userinfo endpoint)
    const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });

    if (!userInfoResponse.ok) {
      const errorText = await userInfoResponse.text();
      console.error('User info fetch failed:', errorText);
      throw new Error(`Failed to get user info: ${errorText}`);
    }

    const userInfo = await userInfoResponse.json();
    console.log('User info retrieved:', { email: userInfo.email, name: userInfo.name });

    if (!userInfo.email) {
      throw new Error('Email not provided by LinkedIn');
    }

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl!, supabaseServiceKey!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if user exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === userInfo.email);

    if (existingUser) {
      // User exists - create a session for them
      console.log('Existing user found, creating session...');
      
      // Generate a magic link token and sign them in
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userInfo.email,
        options: {
          redirectTo: baseRedirect,
        },
      });

      if (linkError) {
        console.error('Generate link error:', linkError);
        throw linkError;
      }

      // Extract the token from the link
      const linkUrl = new URL(linkData.properties.action_link);
      const token = linkUrl.searchParams.get('token');
      const type = linkUrl.searchParams.get('type');

      // Redirect to the verification endpoint
      const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(baseRedirect + '/dashboard')}`;
      
      console.log('Redirecting existing user to verify...');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': verifyUrl,
        },
      });
    } else {
      // Create new user
      console.log('Creating new user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: userInfo.email,
        email_confirm: true,
        user_metadata: {
          full_name: userInfo.name,
          avatar_url: userInfo.picture,
          provider: 'linkedin',
        },
      });

      if (createError) {
        console.error('Create user error:', createError);
        throw createError;
      }

      const userId = newUser.user.id;

      // Create profile for new user
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          name: userInfo.name || userInfo.email.split('@')[0],
          email: userInfo.email,
          avatar_url: userInfo.picture,
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // Don't throw - profile creation is non-critical
      }

      // Generate magic link for the new user
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email: userInfo.email,
        options: {
          redirectTo: baseRedirect,
        },
      });

      if (linkError) {
        console.error('Generate link error:', linkError);
        throw linkError;
      }

      const linkUrl = new URL(linkData.properties.action_link);
      const token = linkUrl.searchParams.get('token');
      const type = linkUrl.searchParams.get('type');

      const verifyUrl = `${supabaseUrl}/auth/v1/verify?token=${token}&type=${type}&redirect_to=${encodeURIComponent(baseRedirect + '/dashboard')}`;
      
      console.log('Redirecting new user to verify...');
      return new Response(null, {
        status: 302,
        headers: {
          'Location': verifyUrl,
        },
      });
    }
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('LinkedIn OAuth callback error:', errorMessage);
    const baseRedirect = Deno.env.get('SITE_URL') || 'https://jibbit.app';
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `${baseRedirect}/auth/callback?error=${encodeURIComponent(errorMessage)}`,
      },
    });
  }
});
