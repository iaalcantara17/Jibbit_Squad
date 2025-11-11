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
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobId, sections = ['summary'] } = await req.json();

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: { code: 'PROFILE_REQUIRED', message: 'Please complete your profile first' } }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get job details if provided
    let job = null;
    if (jobId) {
      const { data: jobData } = await supabaseClient
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();
      job = jobData;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: { code: 'API_KEY_MISSING', message: 'API key not configured' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build prompt based on section type
    const sectionType = sections[0];
    let prompt = '';
    const systemPrompt = 'You are an expert resume writer. Generate professional, ATS-optimized content in complete sentences or bullet points. Never split sentences mid-phrase.';

    if (sectionType === 'summary') {
      prompt = buildSummaryPrompt(profile, job);
    } else if (sectionType === 'experience') {
      prompt = buildExperiencePrompt(profile, job);
    } else if (sectionType === 'skills') {
      prompt = buildSkillsPrompt(profile, job);
    }

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
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: "function",
          function: {
            name: "generate_content",
            description: `Generate ${sectionType} content`,
            parameters: {
              type: "object",
              properties: {
                variations: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      content: { type: "string", description: "Complete sentences or bullet points, never mid-phrase fragments" },
                      atsScore: { type: "number", minimum: 0, maximum: 100 },
                      keywords: { type: "array", items: { type: "string" } }
                    },
                    required: ["content", "atsScore", "keywords"]
                  }
                }
              },
              required: ["variations"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "generate_content" } }
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
      return new Response(JSON.stringify({ error: { code: 'AI_ERROR', message: 'Failed to generate content' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    const result = toolCall?.function?.arguments 
      ? JSON.parse(toolCall.function.arguments)
      : { variations: [] };

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-resume-content:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: errorMessage } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildSummaryPrompt(profile: any, job: any) {
  let prompt = `Generate 3 professional summary variations for:\n\nCandidate:\n`;
  prompt += `Name: ${profile.name}\n`;
  if (profile.professional_headline) prompt += `Headline: ${profile.professional_headline}\n`;
  if (profile.bio) prompt += `Bio: ${profile.bio}\n`;
  
  if (profile.employment_history && Array.isArray(profile.employment_history) && profile.employment_history.length > 0) {
    prompt += `\nRecent Experience:\n`;
    profile.employment_history.slice(0, 2).forEach((exp: any) => {
      prompt += `- ${exp.jobTitle || exp.role} at ${exp.company}\n`;
    });
  }
  
  if (job) {
    prompt += `\nTarget Role: ${job.job_title} at ${job.company_name}\n`;
    if (job.job_description) prompt += `Job Description: ${job.job_description.substring(0, 500)}...\n`;
  }
  
  prompt += `\nGenerate 3 concise summaries (2-3 complete sentences each) highlighting relevant achievements and skills. Each sentence must be complete and grammatically correct.`;
  return prompt;
}

function buildExperiencePrompt(profile: any, job: any) {
  let prompt = `Generate 3 experience bullet variations:\n\n`;
  
  if (profile.employment_history && Array.isArray(profile.employment_history) && profile.employment_history.length > 0) {
    prompt += `Current Experience:\n`;
    profile.employment_history.slice(0, 1).forEach((exp: any) => {
      prompt += `${exp.jobTitle || exp.role} at ${exp.company}\n`;
      if (exp.description) prompt += `Current: ${exp.description}\n`;
    });
  }
  
  if (job) {
    prompt += `\nTarget: ${job.job_title} at ${job.company_name}\n`;
  }
  
  prompt += `\nGenerate 3 sets of 3-4 bullet points each. Each bullet must be a complete sentence with quantifiable achievements. Never split sentences.`;
  return prompt;
}

function buildSkillsPrompt(profile: any, job: any) {
  let prompt = `Suggest skills to add:\n\n`;
  
  if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
    prompt += `Current Skills: ${profile.skills.map((s: any) => s.name || s).join(', ')}\n`;
  }
  
  if (job) {
    prompt += `\nTarget Role: ${job.job_title}\n`;
    if (job.job_description) prompt += `Requirements: ${job.job_description.substring(0, 500)}...\n`;
  }
  
  prompt += `\nGenerate 3 variations of skill lists (8-10 skills each) optimized for ATS. List skills as complete terms, not fragments.`;
  return prompt;
}
