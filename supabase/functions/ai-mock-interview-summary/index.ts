import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Get session and responses
    const { data: session, error: sessionError } = await supabase
      .from("mock_interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (sessionError) throw sessionError;

    const { data: responses, error: responsesError } = await supabase
      .from("mock_interview_responses")
      .select(`
        *,
        question:question_bank_items(question_text, category, difficulty)
      `)
      .eq("session_id", sessionId);

    if (responsesError) throw responsesError;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    const systemPrompt = `You are an expert interview coach providing constructive feedback on mock interview performance.

CRITICAL RULES:
1. Be encouraging and constructive
2. Focus on specific improvements
3. Acknowledge strengths first
4. Never claim this represents real interview outcomes
5. Provide actionable advice

Session Details:
- Role: ${session.target_role}
- Company: ${session.company_name || "General"}
- Format: ${session.format}
- Questions: ${session.question_count}

Analyze the candidate's responses and provide:
1. Overall performance summary (2-3 sentences)
2. Key strengths (2-3 specific observations)
3. Areas for improvement (2-3 specific areas)
4. Specific recommendations (3-4 actionable steps)

Keep your response under 400 words and focus on being helpful, not judgmental.`;

    const userPrompt = `Here are the candidate's responses from the mock interview:

${responses?.map((r: any, idx: number) => `
Question ${idx + 1} (${r.question?.category}, ${r.question?.difficulty}):
"${r.question?.question_text}"

Response (${r.time_taken || 0}s):
"${r.response_text || 'No response provided'}"
`).join('\n')}

Please provide comprehensive feedback focusing on what they did well and how they can improve.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const aiSummary = aiData.choices?.[0]?.message?.content;
    
    if (!aiSummary) {
      throw new Error("No response from AI");
    }

    // Update summary with AI content
    const { error: updateError } = await supabase
      .from("mock_interview_summaries")
      .update({ ai_summary: aiSummary })
      .eq("session_id", sessionId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ summary: aiSummary }),
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