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

    // Fetch user profile
    const { data: profile } = await supabase
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

    // Fetch job details
    const { data: job } = await supabase
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

    const jobDescription = job.job_description || `${job.job_title} at ${job.company_name}`;
    const currentContent = profile.bio || '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `You are an expert career coach specializing in tailoring cover letters. Analyze the user's experience and suggest specific improvements to highlight the most relevant experiences for the job.

Your task:
1. Compare the job description with the user's profile (employment history, skills, projects, education)
2. Identify sections in the current cover letter that could be enhanced to better highlight relevant experience
3. Provide specific rewrite suggestions that:
   - Emphasize quantifiable achievements related to the job requirements
   - Use keywords from the job description naturally
   - Showcase transferable skills and relevant projects
   - Maintain the authentic voice and tone

Return suggestions in this format:
{
  "suggestions": [
    {
      "original": "exact text from cover letter to replace",
      "highlighted": "improved version with relevant experience emphasized",
      "relevance": "high|medium|low",
      "reason": "brief explanation of why this change improves the cover letter"
    }
  ]
}`;

    const userPrompt = `Job Description:
${jobDescription}

Current Cover Letter Content:
${currentContent}

User Profile:
Employment History: ${JSON.stringify(profile.employment_history || [])}
Skills: ${JSON.stringify(profile.skills || [])}
Projects: ${JSON.stringify(profile.projects || [])}
Education: ${JSON.stringify(profile.education || [])}

Provide 3-5 targeted suggestions to better highlight relevant experience.`;

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
            name: "provide_suggestions",
            description: "Provide experience highlighting suggestions",
            parameters: {
              type: "object",
              properties: {
                suggestions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      original: { type: "string" },
                      highlighted: { type: "string" },
                      relevance: { type: "string", enum: ["high", "medium", "low"] },
                      reason: { type: "string" }
                    },
                    required: ["original", "highlighted", "relevance", "reason"]
                  }
                }
              },
              required: ["suggestions"]
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "provide_suggestions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments 
      ? JSON.parse(toolCall.function.arguments)
      : { suggestions: [] };

    // Format for resume experience tailoring
    const tailored = result.suggestions?.map((s: any) => ({
      original: s.original,
      improved: s.highlighted,
      relevance: s.relevance,
      reason: s.reason
    })) || [];

    return new Response(JSON.stringify({ tailored }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-tailor-experience:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
