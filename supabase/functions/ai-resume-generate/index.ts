import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { resumeId, jobId, sections } = await req.json();

    // Get user profile
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get job details if jobId provided
    let job = null;
    if (jobId) {
      const { data: jobData } = await supabaseClient
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single();
      job = jobData;
    }

    // Build AI prompt
    const prompt = buildResumePrompt(profile, job, sections);

    // Call OpenAI
    const openAIKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume writer and career coach. Generate professional, ATS-optimized resume content that highlights achievements and uses strong action verbs.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'OpenAI API error');
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    const parsedContent = parseGeneratedContent(generatedText, sections);

    // Update resume with AI metadata
    if (resumeId) {
      await supabaseClient
        .from('resumes')
        .update({
          ai_generated: {
            lastGenerated: new Date().toISOString(),
            model: 'gpt-4o-mini',
            tailoredForJob: jobId || null,
            prompt: `Generated content for sections: ${sections.join(', ')}`
          }
        })
        .eq('id', resumeId);
    }

    return new Response(JSON.stringify({ generatedContent: parsedContent }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in ai-resume-generate:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function buildResumePrompt(profile: any, job: any, sections: string[]) {
  let prompt = `Generate professional resume content for:\n\nUser Profile:\n`;
  prompt += `Name: ${profile.name}\n`;
  prompt += `Email: ${profile.email}\n`;

  if (profile.professional_headline) prompt += `Headline: ${profile.professional_headline}\n`;
  if (profile.bio) prompt += `Bio: ${profile.bio}\n`;

  if (profile.employment_history && Array.isArray(profile.employment_history) && profile.employment_history.length > 0) {
    prompt += `\nWork Experience:\n`;
    profile.employment_history.forEach((exp: any) => {
      prompt += `- ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n`;
      if (exp.description) prompt += `  ${exp.description}\n`;
    });
  }

  if (profile.skills && Array.isArray(profile.skills) && profile.skills.length > 0) {
    prompt += `\nSkills: ${profile.skills.map((s: any) => s.name).join(', ')}\n`;
  }

  if (job) {
    prompt += `\n\nTailor content for this job:\nPosition: ${job.job_title}\nCompany: ${job.company_name}\n`;
    if (job.job_description) {
      prompt += `Job Description: ${job.job_description.substring(0, 500)}...\n`;
    }
  }

  prompt += `\nGenerate content for these sections: ${sections.join(', ')}\n`;
  prompt += `\nProvide professional, ATS-optimized content with strong action verbs and quantified achievements.`;

  return prompt;
}

function parseGeneratedContent(text: string, sections: string[]) {
  const content: Record<string, string> = {};
  
  sections.forEach(section => {
    const sectionRegex = new RegExp(`${section}:?\\s*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(sectionRegex);
    
    if (match) {
      content[section] = match[1].trim();
    }
  });

  return content;
}
