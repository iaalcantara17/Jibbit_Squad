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
    const prompt = `Research ${companyName}${companyWebsite ? ` (${companyWebsite})` : ''}.

Focus on CURRENT and RECENT information (last 6 months):

1. Industry classification and current market position
2. Company mission statement or core values (as stated today, not founding history)
3. Recent significant developments:
   - Product launches or updates
   - Funding rounds or financial news
   - Major partnerships or acquisitions
   - Awards or recognition
   - Expansion plans or new offices

Avoid:
- Company founding stories unless recent (< 1 year)
- Executive biographies unless recently appointed
- Generic historical information
- Outdated news (> 6 months old)

Be factual, current, and actionable for a job applicant researching before an interview.`;

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
          { role: 'system', content: 'You are a company research analyst focused on current, relevant information for job seekers. Prioritize recent developments over historical data.' },
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

    // Parse research into structured format with helper functions
    const extractSection = (text: string, keyword: string): string => {
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(keyword.toLowerCase())) {
          return lines[i].split(':')[1]?.trim() || lines[i + 1]?.trim() || '';
        }
      }
      return '';
    };

    const parseRecentNews = (text: string): Array<{title: string; date: string; summary: string}> => {
      const newsItems: Array<{title: string; date: string; summary: string}> = [];
      const lines = text.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('News') || lines[i].match(/\d+\./)) {
          const title = lines[i].replace(/^\d+\./, '').trim();
          if (title.length > 10) {
            newsItems.push({
              title,
              date: 'Recent',
              summary: lines[i + 1]?.trim() || title,
            });
          }
        }
      }
      return newsItems.slice(0, 5);
    };

    const structuredResearch = {
      companyInfo: {
        name: companyName,
        industry: extractSection(researchContent, 'industry') || 'Technology',
        size: extractSection(researchContent, 'size') || 'Not available',
      },
      mission: extractSection(researchContent, 'mission') || extractSection(researchContent, 'values') || 'Information not available',
      recentNews: parseRecentNews(researchContent),
      fullText: researchContent,
    };

    return new Response(JSON.stringify(structuredResearch), {
      status: 200,
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
