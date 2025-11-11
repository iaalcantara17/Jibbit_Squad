import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { share_token } = await req.json();

    if (!share_token) {
      throw new Error('Missing share token');
    }

    // Validate share
    const { data: share, error: shareError } = await supabaseClient
      .from('resume_shares_v2')
      .select('*')
      .eq('share_token', share_token)
      .eq('is_active', true)
      .single();

    if (shareError || !share) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'INVALID_TOKEN',
            message: 'Invalid or expired share link',
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check expiry
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'EXPIRED_TOKEN',
            message: 'Share link has expired',
          },
        }),
        {
          status: 410,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get resume content
    const { data: resume, error: resumeError } = await supabaseClient
      .from('resumes')
      .select('title, sections, styling')
      .eq('id', share.resume_id)
      .single();

    if (resumeError || !resume) {
      throw new Error('Resume not found');
    }

    // Get comments
    const { data: comments, error: commentsError } = await supabaseClient
      .from('resume_comments')
      .select('id, author_name, body, created_at')
      .eq('share_id', share.id)
      .order('created_at', { ascending: true });

    if (commentsError) {
      console.error('Failed to fetch comments:', commentsError);
    }

    return new Response(
      JSON.stringify({
        resume: {
          title: resume.title,
          sections: resume.sections,
          styling: resume.styling,
        },
        can_comment: share.can_comment,
        comments: comments || [],
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Resume share resolve error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'RESOLVE_FAILED',
          message: error instanceof Error ? error.message : 'Failed to resolve share',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
