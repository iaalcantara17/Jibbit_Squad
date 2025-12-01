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
    const { action, code } = await req.json();

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    if (action === 'start_oauth') {
      // Start Google OAuth flow
      const clientId = Deno.env.get('GOOGLE_CONTACTS_CLIENT_ID');
      const redirectUri = Deno.env.get('GOOGLE_CONTACTS_REDIRECT_URI');

      if (!clientId || !redirectUri) {
        return new Response(JSON.stringify({ 
          error: 'Google Contacts integration not configured' 
        }), {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const scopes = [
        'https://www.googleapis.com/auth/contacts.readonly',
      ];

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: 'code',
        scope: scopes.join(' '),
        access_type: 'offline',
        state: user.id, // Pass user ID in state
      })}`;

      return new Response(JSON.stringify({ authUrl }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'complete_import' && code) {
      // Exchange code for tokens
      const clientId = Deno.env.get('GOOGLE_CONTACTS_CLIENT_ID');
      const clientSecret = Deno.env.get('GOOGLE_CONTACTS_CLIENT_SECRET');
      const redirectUri = Deno.env.get('GOOGLE_CONTACTS_REDIRECT_URI');

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId!,
          client_secret: clientSecret!,
          redirect_uri: redirectUri!,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await tokenResponse.json();

      if (!tokens.access_token) {
        throw new Error('Failed to obtain access token');
      }

      // Fetch contacts from Google People API
      const contactsResponse = await fetch(
        'https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers,organizations',
        {
          headers: { Authorization: `Bearer ${tokens.access_token}` },
        }
      );

      const contactsData = await contactsResponse.json();
      const connections = contactsData.connections || [];

      // Map and import contacts
      const contacts = [];
      const duplicates = [];

      for (const person of connections) {
        const name = person.names?.[0]?.displayName;
        const email = person.emailAddresses?.[0]?.value;
        const phone = person.phoneNumbers?.[0]?.value;
        const company = person.organizations?.[0]?.name;
        const role = person.organizations?.[0]?.title;

        if (!name) continue;

        // Check for duplicates by email
        if (email) {
          const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('user_id', user.id)
            .eq('email', email)
            .single();

          if (existing) {
            duplicates.push({ name, email });
            continue;
          }
        }

        contacts.push({
          user_id: user.id,
          name,
          email: email || null,
          phone: phone || null,
          company: company || null,
          role: role || null,
        });
      }

      // Batch insert contacts
      if (contacts.length > 0) {
        const { error: insertError } = await supabase
          .from('contacts')
          .insert(contacts);

        if (insertError) throw insertError;
      }

      return new Response(JSON.stringify({ 
        imported: contacts.length, 
        duplicates: duplicates.length 
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');
  } catch (error: any) {
    console.error('Google contacts import error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
