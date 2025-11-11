import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName } = await req.json();

    if (!companyName || companyName.length > 200) {
      return new Response(
        JSON.stringify({ error: { code: 'INVALID_INPUT', message: 'Invalid company name' } }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const prompt = `Find 2-3 recent news items about ${companyName} from the past 6 months. For each news item, provide:
- title
- date (YYYY-MM-DD format)
- source (news outlet name)
- summary (1-2 sentences)
- url (if available, otherwise use "#")

Return as JSON: { "items": [{"title": "", "date": "", "source": "", "summary": "", "url": ""}] }`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: 'You are a business news researcher. Provide recent, factual news about companies in structured JSON format.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: { code: 'RATE_LIMIT', message: 'Rate limit exceeded, please try again later' } }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: { code: 'PAYMENT_REQUIRED', message: 'Please add credits to continue using AI features' } }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI API request failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extract JSON safely
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { items: [] };

    // Ensure all items have required fields
    const sanitizedItems = (result.items || []).map((item: any) => ({
      title: String(item.title || '').substring(0, 200),
      date: String(item.date || new Date().toISOString().split('T')[0]),
      source: String(item.source || 'Unknown').substring(0, 100),
      summary: String(item.summary || '').substring(0, 500),
      url: String(item.url || '#').substring(0, 500),
    }));

    return new Response(
      JSON.stringify({ items: sanitizedItems }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in ai-company-news:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: { code: 'INTERNAL_ERROR', message: errorMessage } }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
