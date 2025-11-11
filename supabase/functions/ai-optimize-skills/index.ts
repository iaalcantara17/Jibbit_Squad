
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
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobId } = await req.json();

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'Please complete your profile first.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get job details
    const { data: job } = await supabaseClient
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userSkills = profile.skills || [];
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert ATS optimization specialist. Analyze skills for job matching and provide structured output following the exact schema.`;

    const userPrompt = `Analyze these skills for a ${job.job_title} position at ${job.company_name}:

User's Current Skills: ${userSkills.map((s: any) => s.name || s).join(', ')}
Job Description: ${job.job_description ? job.job_description.substring(0, 1000) : 'Not provided'}

Provide a comprehensive skills analysis including:
1. Overall match score (0-100)
2. Skills to emphasize
3. Skills to add
4. Technical vs soft skills categorization
5. Identify skill gaps`;

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
            name: "optimize_skills",
            description: "Return optimized skills analysis",
            parameters: {
              type: "object",
              properties: {
                score: { type: "number", minimum: 0, maximum: 100 },
                emphasize: { type: "array", items: { type: "string" } },
                add: { type: "array", items: { type: "string" } },
                technical: { type: "array", items: { type: "string" } },
                soft: { type: "array", items: { type: "string" } },
                gaps: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      skill: { type: "string" },
                      reason: { type: "string" }
                    },
                    required: ["skill", "reason"]
                  }
                }
              },
              required: ["score", "emphasize", "add", "technical", "soft", "gaps"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "optimize_skills" } }
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
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments 
      ? JSON.parse(toolCall.function.arguments)
      : { score: 0, emphasize: [], add: [], technical: [], soft: [], gaps: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-optimize-skills:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
