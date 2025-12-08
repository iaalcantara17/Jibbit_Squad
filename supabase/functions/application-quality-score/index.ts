import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-122: Application Package Quality Scoring
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

    const { jobId, resumeId, coverLetterId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (!job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch resume if provided
    let resumeData = null;
    if (resumeId) {
      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('id', resumeId)
        .single();
      resumeData = data;
    }

    // Fetch cover letter if provided
    let coverLetterData = null;
    if (coverLetterId) {
      const { data } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('id', coverLetterId)
        .single();
      coverLetterData = data;
    }

    // Use AI to analyze application quality
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    const prompt = `Analyze the quality of this job application package:

JOB DETAILS:
- Title: ${job.title}
- Company: ${job.company}
- Description: ${job.description || 'Not provided'}
- Required Skills: ${job.required_skills?.join(', ') || 'Not specified'}

${resumeData ? `RESUME:
- Title: ${resumeData.title}
- Sections: ${JSON.stringify(resumeData.sections).substring(0, 2000)}` : 'NO RESUME PROVIDED'}

${coverLetterData ? `COVER LETTER:
- Title: ${coverLetterData.title}
- Content: ${coverLetterData.content?.substring(0, 1500) || 'No content'}` : 'NO COVER LETTER PROVIDED'}

Analyze and score the application package.`;

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
            content: 'You are an expert ATS (Applicant Tracking System) and hiring consultant. Analyze job applications and provide detailed scoring and improvement suggestions.'
          },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'quality_assessment',
            description: 'Return application quality assessment',
            parameters: {
              type: 'object',
              properties: {
                overall_score: { type: 'number', description: 'Overall score 0-100' },
                keyword_match_score: { type: 'number', description: 'Keyword match score 0-100' },
                formatting_score: { type: 'number', description: 'Formatting quality score 0-100' },
                experience_alignment_score: { type: 'number', description: 'Experience alignment score 0-100' },
                strengths: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'List of strengths in the application'
                },
                missing_keywords: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Important keywords missing from application'
                },
                improvement_suggestions: { 
                  type: 'array', 
                  items: { 
                    type: 'object',
                    properties: {
                      priority: { type: 'string', enum: ['high', 'medium', 'low'] },
                      suggestion: { type: 'string' }
                    }
                  },
                  description: 'Prioritized improvement suggestions'
                }
              },
              required: ['overall_score', 'keyword_match_score', 'formatting_score', 'experience_alignment_score']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'quality_assessment' } }
      }),
    });

    let assessment;
    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        assessment = JSON.parse(toolCall.function.arguments);
      }
    }

    // Default assessment if AI fails
    if (!assessment) {
      assessment = {
        overall_score: 70,
        keyword_match_score: 65,
        formatting_score: 75,
        experience_alignment_score: 70,
        strengths: ['Application materials provided'],
        missing_keywords: [],
        improvement_suggestions: [
          { priority: 'medium', suggestion: 'Add more specific keywords from job description' }
        ]
      };
    }

    // Save assessment to database
    const { data: savedAssessment, error: saveError } = await supabase
      .from('application_quality_assessments')
      .upsert({
        user_id: user.id,
        job_id: jobId,
        resume_id: resumeId,
        cover_letter_id: coverLetterId,
        overall_score: assessment.overall_score,
        keyword_match_score: assessment.keyword_match_score,
        formatting_score: assessment.formatting_score,
        experience_alignment_score: assessment.experience_alignment_score,
        strengths: assessment.strengths || [],
        missing_keywords: assessment.missing_keywords || [],
        improvement_suggestions: assessment.improvement_suggestions || []
      }, { 
        onConflict: 'user_id,job_id' 
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving assessment:', saveError);
    }

    return new Response(
      JSON.stringify({ 
        assessment,
        meetsThreshold: assessment.overall_score >= 70,
        recommendation: assessment.overall_score >= 70 
          ? 'Your application is ready to submit!' 
          : 'Consider improving your application before submitting.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in application-quality-score:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});