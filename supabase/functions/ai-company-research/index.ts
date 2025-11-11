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

    const { companyName, companyWebsite } = await req.json();

    if (!companyName) {
      return new Response(JSON.stringify({ error: 'Company name is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build research prompt
    const prompt = `Research and provide comprehensive information about ${companyName}${companyWebsite ? ` (${companyWebsite})` : ''}:

Please provide:
1. Company Overview (size, industry, headquarters, founding year)
2. Mission & Values (company mission statement and core values)
3. Products & Services (main offerings and target market)
4. Recent News (last 6 months - funding, product launches, expansions, awards)
5. Company Culture (work environment, employee benefits, diversity initiatives)
6. Leadership (key executives and their backgrounds)
7. Market Position (competitors, market share, growth trajectory)
8. Interview Process (typical hiring process and what they look for)

Format the response as a structured JSON object with these sections.
Be factual and current. If information is not available, indicate that clearly.`;

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
          { role: 'system', content: 'You are a research assistant specializing in company intelligence for job seekers. Provide accurate, up-to-date company information.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI API error:', aiResponse.status, errorText);
      return new Response(JSON.stringify({ error: 'Company research failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const aiData = await aiResponse.json();
    const researchContent = aiData.choices[0].message.content;

    // Try to parse as JSON, fallback to structured text
    let structuredResearch;
    try {
      const jsonMatch = researchContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        structuredResearch = JSON.parse(jsonMatch[0]);
      } else {
        structuredResearch = { fullText: researchContent };
      }
    } catch (e) {
      structuredResearch = { fullText: researchContent };
    }

    return new Response(JSON.stringify({ research: structuredResearch }), {
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
