import "https://deno.land/x/xhr@0.1.0/mod.ts";
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

    const { jobId, tone = 'professional', template = 'formal', researchContext = '' } = await req.json();

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

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

    // Build prompt based on tone and template with optional research context
    const prompt = buildCoverLetterPrompt(profile, job, tone, template, researchContext);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: { code: 'API_KEY_MISSING', message: 'API key not configured' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
          {
            role: 'system',
            content: `You are an expert cover letter writer. Generate professional, personalized cover letters that demonstrate genuine interest and highlight relevant qualifications. Use a ${tone} tone and follow the ${template} format.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
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
      return new Response(JSON.stringify({ error: { code: 'AI_ERROR', message: 'Failed to generate cover letter' } }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const generatedContent = data.choices[0].message.content;

    return new Response(JSON.stringify({ content: generatedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-cover-letter-generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: errorMessage } }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildCoverLetterPrompt(profile: any, job: any, tone: string, template: string, researchContext: string) {
  let prompt = '';
  
  // Add research context first if available
  if (researchContext) {
    prompt += researchContext;
  }
  
  prompt += `Generate a ${tone} cover letter for the following job application:\n\n`;
  
  prompt += `Candidate Information:\n`;
  prompt += `Name: ${profile.name}\n`;
  prompt += `Email: ${profile.email}\n`;
  if (profile.professional_headline) prompt += `Headline: ${profile.professional_headline}\n`;
  if (profile.bio) prompt += `Bio: ${profile.bio}\n`;
  
  prompt += `\nJob Information:\n`;
  prompt += `Position: ${job.job_title}\n`;
  prompt += `Company: ${job.company_name}\n`;
  if (job.job_description) {
    prompt += `Description: ${job.job_description.substring(0, 800)}...\n`;
  }
  
  if (profile.employment_history && Array.isArray(profile.employment_history) && profile.employment_history.length > 0) {
    prompt += `\nRelevant Experience:\n`;
    profile.employment_history.slice(0, 3).forEach((exp: any) => {
      prompt += `- ${exp.jobTitle} at ${exp.company}\n`;
      if (exp.description) prompt += `  ${exp.description.substring(0, 200)}\n`;
    });
  }
  
  if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
    prompt += `\nKey Skills: ${profile.skills.slice(0, 8).map((s: any) => s.name).join(', ')}\n`;
  }
  
  prompt += `\nRequirements:\n`;
  prompt += `1. Opening paragraph: ${researchContext ? 'Use the company research to show genuine interest and understanding of their current work' : 'Express enthusiasm and explain why you\'re interested'}\n`;
  prompt += `2. Body paragraphs: Highlight 2-3 relevant achievements that match job requirements\n`;
  prompt += `3. Closing paragraph: Thank them and express eagerness to discuss further\n`;
  prompt += `4. Use specific examples and quantify achievements where possible\n`;
  prompt += `5. Keep total length to 3-4 paragraphs\n`;
  prompt += `6. Maintain a ${tone} tone throughout\n`;
  
  return prompt;
}
