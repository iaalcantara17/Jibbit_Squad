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
    const { responseId } = await req.json();

    if (!responseId) {
      return new Response(
        JSON.stringify({ error: "Missing responseId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Get response with question details
    const { data: response, error: responseError } = await supabase
      .from("question_practice_responses")
      .select(`
        *,
        question:question_bank_items(*)
      `)
      .eq("id", responseId)
      .eq("user_id", user.id)
      .single();

    if (responseError) throw responseError;

    if (!response) {
      throw new Error("Response not found");
    }

    const question = response.question;
    if (!question) {
      throw new Error("Question not found");
    }

    // Get Lovable API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build system prompt
    const systemPrompt = `You are an expert interview coach providing feedback on practice interview responses.

CRITICAL RULES:
1. Be constructive and encouraging while being honest
2. Never claim this feedback represents real interview outcomes
3. Focus on actionable improvements
4. Provide specific examples from their response
5. Your response MUST be valid JSON

Question Type: ${question.category}
Question: ${question.question_text}

${question.category === 'behavioral' ? `
For behavioral questions, evaluate STAR framework adherence:
- Situation: Did they describe the context?
- Task: Did they explain their responsibility?
- Action: Did they detail their specific actions?
- Result: Did they quantify outcomes/impact?
` : ''}

Evaluate the response on these dimensions (0-10 each):
1. RELEVANCE: How well does it answer the question?
2. SPECIFICITY: Are there concrete examples and details?
3. IMPACT: Do they demonstrate meaningful results?
4. CLARITY: Is it well-structured and easy to follow?

Your response MUST be a valid JSON object with this exact structure:
{
  "relevance_score": number (0-10),
  "specificity_score": number (0-10),
  "impact_score": number (0-10),
  "clarity_score": number (0-10),
  "overall_score": number (average of the 4 scores),
  ${question.category === 'behavioral' ? `
  "star_adherence": {
    "situation": boolean,
    "task": boolean,
    "action": boolean,
    "result": boolean,
    "feedback": "string - specific feedback on STAR usage"
  },
  ` : `"star_adherence": null,`}
  "weak_language": [
    {
      "phrase": "exact phrase from response",
      "alternative": "stronger alternative",
      "reason": "why the alternative is better"
    }
  ],
  "speaking_time_estimate": number (estimated seconds to speak this response),
  "alternative_approaches": [
    "First alternative approach (2-3 sentences)",
    "Second alternative approach (2-3 sentences)"
  ],
  "general_feedback": "Overall constructive feedback highlighting strengths and areas for improvement (3-5 sentences)"
}`;

    const userPrompt = `Please analyze this interview response:

"${response.response_text}"

Time taken: ${response.time_taken ? `${Math.floor(response.time_taken / 60)} minutes ${response.time_taken % 60} seconds` : 'Not tracked'}
${response.timer_duration ? `Timer set: ${response.timer_duration} minutes` : ''}`;

    // Call Lovable AI
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
        temperature: 0.4,
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
    const feedbackText = aiData.choices?.[0]?.message?.content;
    
    if (!feedbackText) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response
    let feedback;
    try {
      feedback = JSON.parse(feedbackText);
    } catch (parseError) {
      console.error("Failed to parse AI response:", feedbackText);
      throw new Error("Invalid AI response format");
    }

    // Insert feedback into database
    const { data: insertedFeedback, error: insertError } = await supabase
      .from("question_practice_feedback")
      .insert({
        response_id: responseId,
        relevance_score: feedback.relevance_score,
        specificity_score: feedback.specificity_score,
        impact_score: feedback.impact_score,
        clarity_score: feedback.clarity_score,
        overall_score: feedback.overall_score,
        star_adherence: feedback.star_adherence,
        weak_language: feedback.weak_language,
        speaking_time_estimate: feedback.speaking_time_estimate,
        alternative_approaches: feedback.alternative_approaches,
        general_feedback: feedback.general_feedback
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Update response status to submitted
    await supabase
      .from("question_practice_responses")
      .update({ status: "submitted" })
      .eq("id", responseId);

    return new Response(
      JSON.stringify({ feedback: insertedFeedback }),
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