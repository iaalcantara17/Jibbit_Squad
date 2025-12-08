import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-124: Job Application Timing Optimizer
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

    const { jobId, action, scheduledTime } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job details
    const { data: job } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .eq('user_id', user.id)
      .single();

    if (!job) {
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'schedule') {
      // Schedule application submission
      await supabase
        .from('application_timing_recommendations')
        .update({
          is_scheduled: true,
          scheduled_submit_at: scheduledTime
        })
        .eq('job_id', jobId)
        .eq('user_id', user.id);

      return new Response(
        JSON.stringify({ success: true, scheduled_at: scheduledTime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate timing recommendation
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    // Optimal submission times based on research
    const optimalDays = ['Tuesday', 'Wednesday', 'Thursday'];
    const optimalHours = { start: 9, end: 11 };

    const isOptimalNow = 
      (dayOfWeek >= 2 && dayOfWeek <= 4) && 
      (hour >= optimalHours.start && hour < optimalHours.end);

    let recommendation;
    let recommendedTime;

    if (isOptimalNow) {
      recommendation = 'Submit now! This is an optimal time for application submissions.';
      recommendedTime = now.toISOString();
    } else {
      // Calculate next optimal time
      let daysToAdd = 0;
      if (dayOfWeek === 0) daysToAdd = 2; // Sunday -> Tuesday
      else if (dayOfWeek === 1) daysToAdd = 1; // Monday -> Tuesday
      else if (dayOfWeek === 5) daysToAdd = 4; // Friday -> Tuesday
      else if (dayOfWeek === 6) daysToAdd = 3; // Saturday -> Tuesday
      else if (hour >= optimalHours.end) daysToAdd = 1;

      const nextOptimal = new Date(now);
      nextOptimal.setDate(nextOptimal.getDate() + daysToAdd);
      nextOptimal.setHours(optimalHours.start, 0, 0, 0);

      recommendedTime = nextOptimal.toISOString();
      recommendation = `Wait until ${optimalDays[0]} at ${optimalHours.start}:00 AM for optimal visibility.`;
    }

    // Check for bad timing factors
    const warnings = [];
    if (dayOfWeek === 5 && hour >= 15) {
      warnings.push('Friday afternoons typically have lower recruiter attention');
    }
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      warnings.push('Weekend submissions often get buried in Monday queues');
    }

    // Get historical success data
    const { data: historicalData } = await supabase
      .from('jobs')
      .select('status, status_updated_at, created_at')
      .eq('user_id', user.id)
      .neq('status', 'interested');

    let historicalSuccessRate = 0.15; // Default
    if (historicalData && historicalData.length > 5) {
      const responses = historicalData.filter(j => 
        ['phone_screen', 'interview', 'offer'].includes(j.status)
      ).length;
      historicalSuccessRate = responses / historicalData.length;
    }

    const timingData = {
      job_id: jobId,
      user_id: user.id,
      recommended_day: isOptimalNow ? optimalDays[dayOfWeek - 2] || 'Today' : optimalDays[0],
      recommended_time_start: `${optimalHours.start}:00:00`,
      recommended_time_end: `${optimalHours.end}:00:00`,
      recommended_timezone: 'America/New_York',
      recommendation_text: recommendation,
      historical_success_rate: historicalSuccessRate,
      timing_score: isOptimalNow ? 95 : 60,
      factors: {
        dayOfWeek: isOptimalNow ? 'optimal' : 'suboptimal',
        timeOfDay: isOptimalNow ? 'optimal' : 'suboptimal',
        warnings
      }
    };

    // Save recommendation
    await supabase
      .from('application_timing_recommendations')
      .upsert(timingData, { onConflict: 'job_id' });

    return new Response(
      JSON.stringify({
        recommendation: timingData,
        submit_now: isOptimalNow,
        next_optimal_time: recommendedTime,
        warnings
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in timing-optimizer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
