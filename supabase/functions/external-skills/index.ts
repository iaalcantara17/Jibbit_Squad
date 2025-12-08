import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-115: External Skills Assessment Platform Integration
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, platform, profileUrl, certificationData } = await req.json();

    switch (action) {
      case 'link_profile': {
        if (!platform || !profileUrl) {
          return new Response(
            JSON.stringify({ error: 'Platform and profile URL are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Validate platform
        const supportedPlatforms = ['hackerrank', 'leetcode', 'codecademy', 'coursera', 'udemy', 'linkedin_learning'];
        if (!supportedPlatforms.includes(platform.toLowerCase())) {
          return new Response(
            JSON.stringify({ error: `Unsupported platform. Supported: ${supportedPlatforms.join(', ')}` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Extract username from URL
        let username = '';
        try {
          const url = new URL(profileUrl);
          const pathParts = url.pathname.split('/').filter(p => p);
          username = pathParts[pathParts.length - 1] || pathParts[0] || '';
        } catch {
          username = profileUrl;
        }

        // Save integration
        const { data: saved } = await supabase
          .from('external_certifications')
          .insert({
            user_id: user.id,
            platform: platform.toLowerCase(),
            platform_username: username,
            profile_url: profileUrl,
            certification_name: `${platform} Profile`,
            is_verified: false
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({ 
            integration: saved,
            message: 'Profile linked. Certifications will be synced when available.'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add_certification': {
        if (!certificationData?.certification_name || !certificationData?.platform) {
          return new Response(
            JSON.stringify({ error: 'Certification name and platform are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: saved } = await supabase
          .from('external_certifications')
          .insert({
            user_id: user.id,
            platform: certificationData.platform,
            certification_name: certificationData.certification_name,
            certification_url: certificationData.certification_url,
            badge_url: certificationData.badge_url,
            completion_date: certificationData.completion_date,
            score: certificationData.score,
            skills_validated: certificationData.skills || [],
            is_verified: !!certificationData.certification_url
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({ certification: saved }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list': {
        const { data: certifications } = await supabase
          .from('external_certifications')
          .select('*')
          .eq('user_id', user.id)
          .order('completion_date', { ascending: false });

        // Group by platform
        const grouped: Record<string, any[]> = {};
        for (const cert of certifications || []) {
          if (!grouped[cert.platform]) {
            grouped[cert.platform] = [];
          }
          grouped[cert.platform].push(cert);
        }

        return new Response(
          JSON.stringify({ 
            certifications: certifications || [],
            grouped,
            total: certifications?.length || 0
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { certificationId } = certificationData || {};
        if (!certificationId) {
          return new Response(
            JSON.stringify({ error: 'Certification ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('external_certifications')
          .delete()
          .eq('id', certificationId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'verify': {
        const { certificationId } = certificationData || {};
        if (!certificationId) {
          return new Response(
            JSON.stringify({ error: 'Certification ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // For now, mark as verified if it has a URL
        const { data: cert } = await supabase
          .from('external_certifications')
          .select('certification_url')
          .eq('id', certificationId)
          .eq('user_id', user.id)
          .single();

        const isVerified = !!cert?.certification_url;

        await supabase
          .from('external_certifications')
          .update({ 
            is_verified: isVerified,
            verified_at: isVerified ? new Date().toISOString() : null
          })
          .eq('id', certificationId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ verified: isVerified }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    console.error('Error in external-skills:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
