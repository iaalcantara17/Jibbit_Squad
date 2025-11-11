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

    const { share_token, author_name, body } = await req.json();

    if (!share_token || !author_name || !body) {
      throw new Error('Missing required fields');
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

    // Check if comments are allowed
    if (!share.can_comment) {
      return new Response(
        JSON.stringify({
          error: {
            code: 'COMMENTS_DISABLED',
            message: 'Comments are not enabled for this share',
          },
        }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Insert comment
    const { data: comment, error: commentError } = await supabaseClient
      .from('resume_comments')
      .insert({
        share_id: share.id,
        author_name: author_name.trim().substring(0, 100),
        body: body.trim().substring(0, 2000),
      })
      .select('id, author_name, body, created_at')
      .single();

    if (commentError) {
      console.error('Failed to insert comment:', commentError);
      throw new Error('Failed to post comment');
    }

    return new Response(
      JSON.stringify({ comment }),
      {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Resume share comment error:', error);
    return new Response(
      JSON.stringify({
        error: {
          code: 'COMMENT_FAILED',
          message: error instanceof Error ? error.message : 'Failed to post comment',
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
