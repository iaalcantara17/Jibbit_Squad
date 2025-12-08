import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-123: Competitive Analysis for Applications
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

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (!job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile for comparison
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Use AI to generate competitive analysis
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a competitive job market analyst. Analyze the user's competitiveness for a job role based on their profile and the job requirements. Provide actionable insights.`
          },
          {
            role: 'user',
            content: `Analyze competitiveness for this job:
Job: ${job.job_title} at ${job.company_name}
Requirements: ${job.job_description || 'Not specified'}
Location: ${job.location || 'Not specified'}

User Profile:
Skills: ${JSON.stringify(profile?.skills || [])}
Experience: ${profile?.experience_level || 'Not specified'}
Industry: ${profile?.industry || 'Not specified'}

Provide estimated number of applicants, competitive score, advantages, disadvantages, and differentiation strategies.`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'competitive_analysis',
            description: 'Return competitive analysis data',
            parameters: {
              type: 'object',
              properties: {
                estimated_applicants: { type: 'number', description: 'Estimated number of applicants' },
                competitive_score: { type: 'number', description: 'Score 0-100' },
                likelihood_percent: { type: 'number', description: 'Likelihood of interview 0-100' },
                advantages: { type: 'array', items: { type: 'string' } },
                disadvantages: { type: 'array', items: { type: 'string' } },
                differentiation_strategies: { type: 'array', items: { type: 'string' } },
                market_position: { type: 'string', enum: ['strong', 'competitive', 'challenging'] }
              },
              required: ['estimated_applicants', 'competitive_score', 'likelihood_percent', 'advantages', 'disadvantages', 'differentiation_strategies', 'market_position']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'competitive_analysis' } }
      }),
    });

    let analysis;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        analysis = JSON.parse(toolCall.function.arguments);
      }
    }

    if (!analysis) {
      // Fallback analysis
      analysis = {
        estimated_applicants: 150,
        competitive_score: 65,
        likelihood_percent: 20,
        advantages: ['Your profile matches some job requirements'],
        disadvantages: ['Unable to perform detailed analysis'],
        differentiation_strategies: ['Highlight unique experiences', 'Customize your application materials'],
        market_position: 'competitive'
      };
    }

    // Save to database
    const { data: saved } = await supabase
      .from('competitive_analysis')
      .upsert({
        job_id: jobId,
        user_id: user.id,
        estimated_applicants: analysis.estimated_applicants,
        competitive_score: analysis.competitive_score,
        likelihood_percent: analysis.likelihood_percent,
        likelihood_interview: analysis.market_position,
        advantages: analysis.advantages,
        disadvantages: analysis.disadvantages,
        differentiation_strategies: analysis.differentiation_strategies,
        market_position: analysis.market_position
      }, { onConflict: 'job_id' })
      .select()
      .single();

    return new Response(
      JSON.stringify({ analysis: saved || analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in competitive-analysis:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
