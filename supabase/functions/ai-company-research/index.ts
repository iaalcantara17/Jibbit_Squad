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

    // Build research prompt with strict relevance criteria
    const prompt = `Research ${companyName}${companyWebsite ? ` (${companyWebsite})` : ''} for a job application.

STRICT REQUIREMENTS - Focus ONLY on:

1. **Current Industry Position** (2024-2025):
   - What industry/sector they operate in TODAY
   - Current market position and competitive advantages
   - Scale and scope of operations NOW

2. **Mission & Values** (as stated currently on website/public materials):
   - Current mission statement
   - Core values they emphasize TODAY
   - Cultural priorities

3. **Recent Developments** (last 3-6 months ONLY):
   - New products/services launched
   - Recent funding, acquisitions, or partnerships
   - Expansion into new markets
   - Recent awards or recognition
   - Current strategic initiatives

CRITICAL EXCLUSIONS - DO NOT include:
- Founding stories or company history
- Executive biographies or personal backgrounds
- Outdated news (older than 6 months)
- Generic information available on Wikipedia
- Layoffs or negative press unless absolutely recent and relevant

Format: Provide concise, factual, actionable information that helps a job applicant understand the company's CURRENT state and direction.`;

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
          { 
            role: 'system', 
            content: 'You are a company research analyst. Provide ONLY current (2024-2025), relevant information for job seekers. Exclude company history, founder bios, and outdated news. Focus on what matters for someone applying NOW: current mission, recent (3-6 months) developments, and current strategic direction. Be concise and factual.'
          },
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
