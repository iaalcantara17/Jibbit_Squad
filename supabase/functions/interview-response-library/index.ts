import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-126: Interview Question Response Library
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, responseId, responseData, questionType, practiceResponse } = await req.json();

    switch (action) {
      case 'list': {
        let query = supabase
          .from('interview_response_library')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (questionType) {
          query = query.eq('question_type', questionType);
        }

        const { data: responses } = await query;

        return new Response(
          JSON.stringify({ responses: responses || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'add': {
        if (!responseData?.question || !responseData?.response) {
          return new Response(
            JSON.stringify({ error: 'Question and response are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: created } = await supabase
          .from('interview_response_library')
          .insert({
            user_id: user.id,
            question: responseData.question,
            response: responseData.response,
            question_type: responseData.question_type || 'behavioral',
            skills_tags: responseData.skills_tags || [],
            companies_used: responseData.companies_used || [],
            success_count: 0,
            edit_history: []
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({ response: created }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        if (!responseId || !responseData) {
          return new Response(
            JSON.stringify({ error: 'Response ID and data are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get current response for edit history
        const { data: current } = await supabase
          .from('interview_response_library')
          .select('edit_history, response')
          .eq('id', responseId)
          .eq('user_id', user.id)
          .single();

        const editHistory = current?.edit_history || [];
        if (current?.response !== responseData.response) {
          editHistory.push({
            previous_response: current?.response,
            edited_at: new Date().toISOString()
          });
        }

        const { data: updated } = await supabase
          .from('interview_response_library')
          .update({
            ...responseData,
            edit_history: editHistory
          })
          .eq('id', responseId)
          .eq('user_id', user.id)
          .select()
          .single();

        return new Response(
          JSON.stringify({ response: updated }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        if (!responseId) {
          return new Response(
            JSON.stringify({ error: 'Response ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('interview_response_library')
          .delete()
          .eq('id', responseId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'practice': {
        if (!responseId || !practiceResponse) {
          return new Response(
            JSON.stringify({ error: 'Response ID and practice response are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Get the stored response
        const { data: stored } = await supabase
          .from('interview_response_library')
          .select('*')
          .eq('id', responseId)
          .eq('user_id', user.id)
          .single();

        if (!stored) {
          return new Response(
            JSON.stringify({ error: 'Response not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Use AI to provide feedback
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
                content: `You are an interview coach. Compare the practice response to the ideal response and provide constructive feedback. Focus on STAR method adherence, clarity, and impact.`
              },
              {
                role: 'user',
                content: `Question: ${stored.question}

Ideal Response: ${stored.response}

Practice Response: ${practiceResponse}

Provide feedback on the practice response including:
1. Score (0-100)
2. What was done well
3. Areas for improvement
4. Specific suggestions`
              }
            ],
            tools: [{
              type: 'function',
              function: {
                name: 'practice_feedback',
                description: 'Return practice feedback',
                parameters: {
                  type: 'object',
                  properties: {
                    score: { type: 'number' },
                    strengths: { type: 'array', items: { type: 'string' } },
                    improvements: { type: 'array', items: { type: 'string' } },
                    suggestions: { type: 'array', items: { type: 'string' } },
                    star_adherence: { type: 'boolean' }
                  },
                  required: ['score', 'strengths', 'improvements', 'suggestions']
                }
              }
            }],
            tool_choice: { type: 'function', function: { name: 'practice_feedback' } }
          }),
        });

        let feedback;
        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            feedback = JSON.parse(toolCall.function.arguments);
          }
        }

        if (!feedback) {
          feedback = {
            score: 70,
            strengths: ['Response was provided'],
            improvements: ['Consider using the STAR method', 'Add more specific examples'],
            suggestions: ['Review your ideal response for guidance'],
            star_adherence: false
          };
        }

        return new Response(
          JSON.stringify({ feedback }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'record_success': {
        if (!responseId) {
          return new Response(
            JSON.stringify({ error: 'Response ID is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { data: current } = await supabase
          .from('interview_response_library')
          .select('success_count')
          .eq('id', responseId)
          .eq('user_id', user.id)
          .single();

        await supabase
          .from('interview_response_library')
          .update({ success_count: (current?.success_count || 0) + 1 })
          .eq('id', responseId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'suggest': {
        // Suggest best response for a given question based on job requirements
        const { question, jobRequirements } = responseData || {};

        if (!question) {
          return new Response(
            JSON.stringify({ error: 'Question is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Find matching responses
        const { data: responses } = await supabase
          .from('interview_response_library')
          .select('*')
          .eq('user_id', user.id)
          .order('success_count', { ascending: false });

        // Simple matching based on question type keywords
        const questionLower = question.toLowerCase();
        let matchedType = 'behavioral';
        if (questionLower.includes('technical') || questionLower.includes('code') || questionLower.includes('algorithm')) {
          matchedType = 'technical';
        } else if (questionLower.includes('situation') || questionLower.includes('scenario')) {
          matchedType = 'situational';
        }

        const suggestions = (responses || [])
          .filter(r => r.question_type === matchedType)
          .slice(0, 3);

        return new Response(
          JSON.stringify({ suggestions }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'export': {
        const { data: responses } = await supabase
          .from('interview_response_library')
          .select('*')
          .eq('user_id', user.id)
          .order('question_type', { ascending: true });

        // Format as interview prep guide
        const grouped: Record<string, any[]> = {};
        for (const r of responses || []) {
          if (!grouped[r.question_type]) {
            grouped[r.question_type] = [];
          }
          grouped[r.question_type].push({
            question: r.question,
            response: r.response,
            skills: r.skills_tags
          });
        }

        return new Response(
          JSON.stringify({ 
            export: grouped,
            format: 'json',
            generated_at: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: unknown) {
    console.error('Error in interview-response-library:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
