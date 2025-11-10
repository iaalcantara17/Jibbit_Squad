import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrammarCheckRequest {
  text: string;
}

interface GrammarIssue {
  message: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text }: GrammarCheckRequest = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Text is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Use Lovable AI for grammar checking
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
            content: `You are a professional grammar and style checker. Analyze the text and return a JSON object with:
- issues: array of {message, suggestion, severity} where severity is "error", "warning", or "info"
- correctedText: the fully corrected version of the text

Focus on:
- Grammar errors (subject-verb agreement, tenses, etc.)
- Spelling mistakes
- Punctuation issues
- Style improvements (clarity, conciseness)
- Professional tone

Return ONLY valid JSON, no additional text.`
          },
          {
            role: 'user',
            content: `Check this text:\n\n${text}`
          }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add more credits.' }),
          {
            status: 402,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse AI response
    let result;
    try {
      result = JSON.parse(content);
    } catch (e) {
      // If AI doesn't return valid JSON, create a basic response
      console.error('AI returned invalid JSON:', content);
      result = {
        issues: [],
        correctedText: text,
      };
    }

    return new Response(
      JSON.stringify({
        issues: result.issues || [],
        correctedText: result.correctedText || text,
        originalText: text,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Grammar check error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
