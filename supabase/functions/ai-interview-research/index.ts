import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Source {
  url?: string;
  text?: string;
  label: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { interviewId, companyName, jobTitle, companyWebsite, sources } = await req.json();

    if (!interviewId || !companyName || !jobTitle) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!companyWebsite && (!sources || sources.length === 0)) {
      return new Response(
        JSON.stringify({ error: "Please provide at least a company website or additional sources" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Lovable API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build context from sources
    let context = `Company: ${companyName}\nRole: ${jobTitle}\n\n`;
    
    if (companyWebsite) {
      context += `Company Website: ${companyWebsite}\n\n`;
    }

    if (sources && sources.length > 0) {
      context += "Additional Sources:\n";
      sources.forEach((source: Source, idx: number) => {
        context += `\nSource ${idx + 1} (${source.label}):\n`;
        if (source.url) {
          context += `URL: ${source.url}\n`;
        }
        if (source.text) {
          context += `Content: ${source.text}\n`;
        }
      });
    }

    const systemPrompt = `You are a research assistant generating company research reports for job interview preparation.

CRITICAL RULES:
1. NEVER make claims without citing a specific source
2. Every piece of information MUST reference one of the provided sources
3. If you cannot find information in the sources, explicitly state "Unverified (needs source)" or omit that section
4. For the "source" field, use the actual URL if provided, or the source label
5. Do NOT hallucinate or invent information
6. Only extract and synthesize what is explicitly stated in the provided sources

Your response MUST be a valid JSON object with this structure:
{
  "overview": {
    "mission": "string or null if not found in sources",
    "values": "string or null if not found in sources",
    "source": "URL or source label, or null if not found"
  },
  "recentDevelopments": [
    {
      "title": "string",
      "summary": "string",
      "date": "string or null",
      "source": "REQUIRED - URL or source label"
    }
  ],
  "leadership": [
    {
      "name": "string",
      "title": "string",
      "bio": "string or null",
      "source": "REQUIRED - URL or source label"
    }
  ],
  "competitiveLandscape": {
    "content": "string or 'Unknown - no source data available'",
    "source": "URL or source label, or null"
  },
  "talkingPoints": ["string array of 3-5 points based on the research"],
  "questions": {
    "roleSpecific": ["string array of 3-5 questions specific to the role"],
    "companySpecific": ["string array of 3-5 questions specific to this company based on research"]
  }
}`;

    // Call Lovable AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await response.json();
    const reportText = aiData.choices?.[0]?.message?.content;
    
    if (!reportText) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let report;
    try {
      report = JSON.parse(reportText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", reportText);
      throw new Error("Invalid AI response format");
    }

    // Add timestamp
    report.generatedAt = new Date().toISOString();

    // Get auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get current interview data
    const { data: interview, error: fetchError } = await supabase
      .from("interviews")
      .select("company_research")
      .eq("id", interviewId)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    // Manage version history (keep last 3)
    const currentVersions = interview?.company_research?.versions || [];
    const newVersions = [
      { report, generatedAt: report.generatedAt },
      ...currentVersions
    ].slice(0, 3); // Keep only last 3 versions

    // Update interview with new research
    const { error: updateError } = await supabase
      .from("interviews")
      .update({
        company_research: {
          versions: newVersions,
          lastGenerated: report.generatedAt
        }
      })
      .eq("id", interviewId)
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return new Response(
      JSON.stringify({ report }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
