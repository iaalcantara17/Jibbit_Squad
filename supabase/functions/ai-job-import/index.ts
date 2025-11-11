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

    const { url } = await req.json();

    console.log('Fetching job posting from URL:', url);

    // Fetch with proper headers to mimic browser behavior
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      console.error('Failed to fetch URL:', response.status, response.statusText);
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Fetched HTML content length:', html.length);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Extract domain for specialized parsing
    const urlObj = new URL(url);
    const domain = urlObj.hostname.toLowerCase();
    
    // Check for LinkedIn or Indeed specific optimizations
    const isLinkedIn = domain.includes('linkedin.com');
    const isIndeed = domain.includes('indeed.com');
    
    const prompt = `Parse job posting data from ${isLinkedIn ? 'LinkedIn' : isIndeed ? 'Indeed' : 'this'} HTML.

CRITICAL: Return ONLY valid JSON - no markdown blocks, no explanations.

Required format:
{
  "job_title": "exact title from posting",
  "company_name": "company name",
  "location": "city, state or Remote",
  "job_description": "full description with key responsibilities and requirements",
  "salary_min": <number or null>,
  "salary_max": <number or null>,
  "job_type": "full-time|part-time|contract|internship|temporary" or null,
  "industry": "industry name" or null,
  "application_deadline": "YYYY-MM-DD" or null
}

${isLinkedIn ? 'LinkedIn tips: Look for job-details, topcard, job-criteria' : ''}
${isIndeed ? 'Indeed tips: Look for jobsearch-JobComponent, icl-u-xs-mb' : ''}

Extract numeric salary values (convert "$80K" to 80000). If range like "$80K-$120K", split to min/max.

HTML (first 12KB):
${html.substring(0, 12000)}`;

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
            content: 'You are a precise job posting parser. Extract ALL available data. Return ONLY valid JSON with no formatting.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
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
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add credits.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await aiResponse.text();
      console.error('AI API error:', status, errorText);
      throw new Error(`AI API error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;
    console.log('AI Response content:', content);

    // Parse JSON - handle markdown wrapping
    let jobData;
    try {
      jobData = JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('Failed to find JSON in response:', content);
        throw new Error('Failed to parse AI response');
      }
      jobData = JSON.parse(jsonMatch[0]);
    }

    console.log('Parsed job data:', jobData);

    // Determine import status based on completeness
    const hasTitle = jobData.job_title && jobData.job_title.trim() !== '';
    const hasCompany = jobData.company_name && jobData.company_name.trim() !== '';
    const hasDescription = jobData.job_description && jobData.job_description.trim() !== '';
    
    let importStatus = 'success';
    if (!hasTitle || !hasCompany) {
      importStatus = 'failed';
    } else if (!hasDescription) {
      importStatus = 'partial';
    }

    return new Response(JSON.stringify({
      ...jobData,
      importStatus,
      originalUrl: url
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      importStatus: 'failed'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
