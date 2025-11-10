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

    const yearsExperience = profile?.employment_history?.length || 0;
    const userLocation = profile?.location || 'Not specified';

    const prompt = `Provide salary research and negotiation recommendations for this position:

JOB:
Title: ${job.job_title}
Company: ${job.company_name}
Location: ${job.location || 'Not specified'}
Posted Salary Range: ${job.salary_min ? `$${job.salary_min} - $${job.salary_max}` : 'Not specified'}

CANDIDATE:
Years of Experience: ${yearsExperience}
Location: ${userLocation}
Education: ${profile?.education?.map((e: any) => e.degree).join(', ') || 'Not specified'}

Provide comprehensive salary research including:
1. Market salary range for this position (min, median, max)
2. Salary adjusted for candidate's experience level
3. Location-based adjustments
4. Total compensation package insights (benefits, equity, bonus)
5. Salary negotiation strategy and tips
6. Comparison with posted range (if available)
7. Industry benchmarks

Return as JSON: {
  "marketRange": {
    "min": 85000,
    "median": 105000,
    "max": 130000,
    "currency": "USD"
  },
  "adjustedForExperience": {
    "recommended": 100000,
    "range": { "min": 95000, "max": 115000 }
  },
  "locationAdjustment": {
    "factor": 1.2,
    "notes": "20% premium for high cost area"
  },
  "totalCompensation": {
    "baseSalary": 105000,
    "bonus": 15000,
    "equity": 25000,
    "benefits": 15000,
    "total": 160000
  },
  "negotiationStrategy": [
    "Start with market median plus 10%",
    "Emphasize relevant experience and skills",
    "Be prepared to discuss total compensation"
  ],
  "comparisonWithPosted": "Posted range aligns well with market data",
  "industryBenchmarks": [
    "Top 25% earn $120k+",
    "Average annual increase: 4-6%"
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
          { role: 'system', content: 'You are an expert salary negotiation consultant. Provide accurate salary research and strategic negotiation advice in JSON format.' },
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
    const salaryData = jsonMatch ? JSON.parse(jsonMatch[0]) : {
      marketRange: { min: 80000, median: 100000, max: 120000, currency: 'USD' },
      adjustedForExperience: { recommended: 95000, range: { min: 90000, max: 110000 } },
      negotiationStrategy: ['Research market rates', 'Know your worth', 'Be confident']
    };

    return new Response(JSON.stringify(salaryData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-salary-research:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
