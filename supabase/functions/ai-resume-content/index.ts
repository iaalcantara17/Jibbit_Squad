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

    const { jobId, sections } = await req.json();

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return new Response(JSON.stringify({ error: 'Error fetching profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!profile) {
      console.log('Profile not found, creating minimal profile data');
      // Create a minimal profile if one doesn't exist
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: user.email?.split('@')[0] || 'User',
          email: user.email
        })
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating profile:', createError);
        return new Response(JSON.stringify({ error: 'Please complete your profile first to use AI features.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build AI prompt
    const prompt = buildResumePrompt(profile, job, sections);

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
          { role: 'system', content: 'You are an expert resume writer who creates ATS-optimized, compelling resume content tailored to specific job postings.' },
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
    const generatedContent = aiData.choices[0].message.content;

    // Parse and structure the generated content
    const structuredContent = parseGeneratedContent(generatedContent, sections);

    return new Response(JSON.stringify({ content: structuredContent }), {
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

function buildResumePrompt(profile: any, job: any, sections: string[]): string {
  return `Generate tailored resume content for the following job application:

JOB DETAILS:
Title: ${job.job_title}
Company: ${job.company_name}
Description: ${job.job_description || 'Not provided'}

CANDIDATE PROFILE:
Name: ${profile.name}
Email: ${profile.email}
Professional Headline: ${profile.professional_headline || ''}
Bio: ${profile.bio || ''}
Location: ${profile.location || ''}

EMPLOYMENT HISTORY:
${JSON.stringify(profile.employment_history || [], null, 2)}

SKILLS:
${JSON.stringify(profile.skills || [], null, 2)}

EDUCATION:
${JSON.stringify(profile.education || [], null, 2)}

REQUESTED SECTIONS: ${sections.join(', ')}

Please generate compelling, ATS-optimized content for each requested section:
- Use action verbs and quantifiable achievements
- Tailor content to match job requirements
- Optimize keywords for ATS compatibility
- Keep bullet points concise (1-2 lines each)
- Maintain professional tone
- Focus on relevant experience and skills

Format your response as JSON with keys matching the section names.`;
}

function parseGeneratedContent(text: string, sections: string[]): any {
  try {
    // Try to parse as JSON first
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error('Failed to parse JSON:', e);
  }

  // Fallback: parse as text sections
  const result: any = {};
  sections.forEach(section => {
    const regex = new RegExp(`${section}:?\\s*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(regex);
    if (match) {
      result[section] = match[1].trim();
    }
  });

  return result;
}
