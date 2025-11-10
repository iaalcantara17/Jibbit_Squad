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

    const { jobId } = await req.json();

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

    // Build matching prompt
    const prompt = `Analyze job fit between this candidate and job posting:

JOB POSTING:
Title: ${job.job_title}
Company: ${job.company_name}
Type: ${job.job_type || 'Not specified'}
Location: ${job.location || 'Not specified'}
Description: ${job.job_description || 'Not provided'}
Salary Range: ${job.salary_min && job.salary_max ? `$${job.salary_min} - $${job.salary_max}` : 'Not specified'}

CANDIDATE PROFILE:
Professional Headline: ${profile.professional_headline || ''}
Bio: ${profile.bio || ''}
Location: ${profile.location || ''}

Experience:
${JSON.stringify(profile.employment_history || [], null, 2)}

Skills:
${JSON.stringify(profile.skills || [], null, 2)}

Education:
${JSON.stringify(profile.education || [], null, 2)}

Certifications:
${JSON.stringify(profile.certifications || [], null, 2)}

Please provide a comprehensive job match analysis in JSON format:
{
  "overallScore": <number 0-100>,
  "matchBreakdown": {
    "skills": { "score": <0-100>, "details": "explanation" },
    "experience": { "score": <0-100>, "details": "explanation" },
    "education": { "score": <0-100>, "details": "explanation" },
    "location": { "score": <0-100>, "details": "explanation" }
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "keySkillsMatch": {
    "matching": ["skill1", "skill2"],
    "missing": ["skill3", "skill4"]
  },
  "applicationStrategy": "Brief strategy for applying to this role"
}`;

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
          { role: 'system', content: 'You are an expert career advisor who analyzes job fit between candidates and positions. Provide honest, constructive assessments.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Job matching analysis failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const analysisContent = aiData.choices[0].message.content;

    // Parse JSON response
    let matchAnalysis;
    try {
      const jsonMatch = analysisContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      console.error('Failed to parse match analysis:', e);
      matchAnalysis = {
        overallScore: 0,
        error: 'Failed to parse analysis',
        rawContent: analysisContent
      };
    }

    return new Response(JSON.stringify({ analysis: matchAnalysis }), {
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
