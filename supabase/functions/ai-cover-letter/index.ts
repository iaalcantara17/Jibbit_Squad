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

    const { jobId, tone = 'professional', template = 'formal' } = await req.json();

    // Fetch user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

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

    // Build AI prompt
    const prompt = buildCoverLetterPrompt(profile, job, tone, template);

    // Call Lovable AI
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
          { role: 'system', content: 'You are an expert career coach who writes compelling, personalized cover letters that highlight candidate strengths and align with company values.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'AI generation failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const coverLetterContent = aiData.choices[0].message.content;

    return new Response(JSON.stringify({ content: coverLetterContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildCoverLetterPrompt(profile: any, job: any, tone: string, template: string): string {
  const companyInfo = typeof job.company_info === 'string' 
    ? JSON.parse(job.company_info) 
    : job.company_info;

  return `Write a compelling cover letter for the following job application:

JOB DETAILS:
Position: ${job.job_title}
Company: ${job.company_name}
Location: ${job.location || 'Not specified'}
Description: ${job.job_description || 'Not provided'}
${companyInfo?.description ? `Company Info: ${companyInfo.description}` : ''}

CANDIDATE INFORMATION:
Name: ${profile.name}
Email: ${profile.email}
Phone: ${profile.phone_number || ''}
Location: ${profile.location || ''}
Professional Headline: ${profile.professional_headline || ''}
Bio: ${profile.bio || ''}
LinkedIn: ${profile.linkedin_url || ''}

EXPERIENCE:
${JSON.stringify(profile.employment_history || [], null, 2)}

SKILLS:
${JSON.stringify(profile.skills || [], null, 2)}

EDUCATION:
${JSON.stringify(profile.education || [], null, 2)}

SPECIAL PROJECTS:
${JSON.stringify(profile.projects || [], null, 2)}

TONE: ${tone}
TEMPLATE: ${template}

Please write a personalized cover letter that:
1. Opens with a strong hook that shows genuine interest in the company/role
2. Highlights 2-3 most relevant experiences with specific achievements
3. Demonstrates understanding of company culture and values
4. Shows how candidate's skills align with job requirements
5. Includes a compelling call-to-action closing
6. Maintains a ${tone} tone throughout
7. Follows a ${template} format
8. Is approximately 300-400 words
9. Uses proper business letter formatting with contact information

Return ONLY the cover letter text, properly formatted with paragraphs.`;
}
