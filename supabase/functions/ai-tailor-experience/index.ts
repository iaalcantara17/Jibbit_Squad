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
    const { jobId } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch user profile with employment history
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: { code: 'PROFILE_REQUIRED', message: 'Please complete your profile first.' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (!job) {
      return new Response(JSON.stringify({ error: { code: 'JOB_NOT_FOUND', message: 'Job not found' } }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const jobDescription = job.job_description || `${job.job_title} at ${job.company_name}`;
    const experiences = profile.employment_history || [];

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert resume consultant. Tailor each resume experience entry to match the job requirements, emphasizing relevant achievements and keywords.`;

    const userPrompt = `Job: ${job.job_title} at ${job.company_name}
Job Description: ${jobDescription}

User's Experience Entries:
${experiences.map((exp: any, idx: number) => `
Entry ${idx}: ${exp.company} - ${exp.role}
${exp.description || exp.summary || ''}`).join('\n')}

For each experience entry, provide:
1. Relevance score (0-100)
2. Tailored markdown description with job-specific keywords and quantifiable achievements`;

    console.log('Calling Lovable AI for experience tailoring...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "tailor_entries",
            description: "Tailor resume experience entries for job",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      experience_id: { type: "string", description: "Use Entry index as uuid placeholder" },
                      relevance_score: { type: "number", minimum: 0, maximum: 100 },
                      suggested_markdown: { type: "string" }
                    },
                    required: ["experience_id", "relevance_score", "suggested_markdown"]
                  }
                }
              },
              required: ["entries"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "tailor_entries" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded' } }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: { code: 'PAYMENT_REQUIRED', message: 'AI credits exhausted' } }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments 
      ? JSON.parse(toolCall.function.arguments)
      : { entries: [] };

    // Map experience IDs to actual UUIDs from profile
    const mappedEntries = result.entries.map((entry: any, idx: number) => ({
      experience_id: experiences[idx]?.id || `exp_${idx}`,
      relevance_score: entry.relevance_score || 0,
      suggested_markdown: entry.suggested_markdown || ''
    }));

    return new Response(JSON.stringify({ entries: mappedEntries }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-tailor-experience:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: errorMessage } }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
