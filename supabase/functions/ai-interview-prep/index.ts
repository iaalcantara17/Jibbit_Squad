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

    const companyInfo = job.company_info || {};

    const prompt = `Provide comprehensive interview preparation insights for this position:

JOB:
Title: ${job.job_title}
Company: ${job.company_name}
Description: ${job.job_description || 'Not provided'}
Company Size: ${companyInfo.size || 'Not specified'}
Industry: ${companyInfo.industry || 'Not specified'}

CANDIDATE BACKGROUND:
Experience: ${profile?.employment_history?.map((e: any) => e.title).join(', ') || 'Not specified'}
Skills: ${profile?.skills?.map((s: any) => s.name).join(', ') || 'Not specified'}

Provide detailed interview preparation including:
1. Typical interview process stages for this company/role
2. Common interview questions (10-15 questions)
3. Company-specific interview format and style
4. Preparation recommendations based on the role
5. Timeline expectations for each stage
6. Success tips and strategies
7. Red flags to watch for
8. Questions the candidate should ask

Return as JSON: {
  "interviewProcess": [
    { "stage": "Phone Screen", "duration": "30 min", "focus": "Cultural fit and basics" },
    { "stage": "Technical Interview", "duration": "60 min", "focus": "Skills assessment" }
  ],
  "commonQuestions": [
    {
      "question": "Tell me about yourself",
      "category": "General",
      "tips": "Focus on relevant experience, keep it under 2 minutes"
    }
  ],
  "interviewFormat": {
    "style": "Behavioral and technical mixed",
    "numberOfRounds": 3,
    "interviewers": "2-3 per round"
  },
  "preparationTips": [
    "Research company products and recent news",
    "Prepare STAR format examples",
    "Practice technical questions"
  ],
  "timeline": {
    "applicationToFirstInterview": "1-2 weeks",
    "totalProcessDuration": "3-4 weeks",
    "decisionTime": "1 week after final"
  },
  "successStrategies": [
    "Show enthusiasm for company mission",
    "Demonstrate problem-solving approach",
    "Ask thoughtful questions"
  ],
  "questionsToAsk": [
    "What does success look like in first 90 days?",
    "How does the team collaborate?",
    "What are growth opportunities?"
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
          { role: 'system', content: 'You are an expert interview coach and career consultant. Provide detailed interview preparation advice in JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
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
    const interviewData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      interviewProcess: [{ stage: 'Initial Interview', duration: '45 min', focus: 'General assessment' }],
      commonQuestions: [{ question: 'Tell me about yourself', category: 'General', tips: 'Be concise' }],
      preparationTips: ['Research the company', 'Practice common questions']
    };

    return new Response(JSON.stringify(interviewData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-interview-prep:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
