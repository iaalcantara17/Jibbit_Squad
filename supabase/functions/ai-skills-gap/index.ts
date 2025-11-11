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

    const prompt = `Analyze skill gaps for this job application:

JOB:
Title: ${job.job_title}
Company: ${job.company_name}
Description: ${job.job_description || 'Not provided'}

CANDIDATE SKILLS:
${userSkills.map((s: any) => `- ${s.name} (${s.level || 'proficient'})`).join('\n')}

Provide a comprehensive skills gap analysis with:
1. Missing critical skills (top 5)
2. Skills to improve (top 5 with current proficiency and target level)
3. Skill priorities (which to learn first based on impact)
4. Learning resources for each gap (courses, certifications, books)
5. Estimated time to close each gap
6. Alternative skills that could compensate

Return as JSON: {
  "missingSkills": [
    {"skill": "Python", "priority": "high", "reason": "Required for 80% of tasks"},
    ...
  ],
  "skillsToImprove": [
    {"skill": "SQL", "current": "intermediate", "target": "advanced", "priority": "medium"},
    ...
  ],
  "learningPath": [
    {"step": 1, "skill": "Python", "resource": "Python for Data Science course", "duration": "4 weeks"},
    ...
  ],
  "alternativeSkills": [
    {"instead": "Java", "alternative": "C#", "reasoning": "Similar paradigm, easier transition"}
  ]
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
          { role: 'system', content: 'You are an expert career development advisor. Analyze skill gaps and provide actionable learning paths.' },
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
    const gapAnalysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      missingSkills: [],
      skillsToImprove: [],
      learningPath: [],
      alternativeSkills: []
    };

    return new Response(JSON.stringify(gapAnalysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-skills-gap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
