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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { jobId } = await req.json();

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

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

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const userSkills = profile?.skills || [];
    const userExperience = profile?.employment_history || [];
    const userEducation = profile?.education || [];

    const prompt = `Analyze the match between this candidate and job opportunity:

JOB:
Title: ${job.job_title}
Company: ${job.company_name}
Description: ${job.job_description || 'Not provided'}
Location: ${job.location || 'Not specified'}

CANDIDATE:
Skills: ${userSkills.map((s: any) => s.name).join(', ')}
Experience: ${userExperience.length} roles
Education: ${userEducation.map((e: any) => e.degree + ' in ' + e.field).join(', ')}

Provide a match analysis with:
1. Overall match score (0-100)
2. Skills match score (0-100) 
3. Experience match score (0-100)
4. Education match score (0-100)
5. Key strengths (3-5 points)
6. Key gaps (3-5 points)
7. Recommendations to improve match (3-5 points)

Return as JSON: {
  "overallScore": 85,
  "breakdown": {
    "skills": 90,
    "experience": 80,
    "education": 85
  },
  "strengths": ["Strong technical skills", "Relevant experience"],
  "gaps": ["Missing certification X", "Limited experience with Y"],
  "recommendations": ["Complete certification in X", "Build project using Y"]
}`;

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are an expert job matching analyst. Analyze candidate-job fit and provide structured JSON responses.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const matchData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      overallScore: 50,
      breakdown: { skills: 50, experience: 50, education: 50 },
      strengths: [],
      gaps: [],
      recommendations: []
    };

    return new Response(JSON.stringify(matchData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-job-match-score:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
