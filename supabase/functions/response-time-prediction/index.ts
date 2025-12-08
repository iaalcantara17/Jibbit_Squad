import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-121: Employer Response Time Prediction
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

    const { jobId } = await req.json();

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

    // Get historical data for similar jobs
    const { data: historicalJobs } = await supabase
      .from('jobs')
      .select('applied_at, status, status_updated_at')
      .eq('user_id', user.id)
      .not('applied_at', 'is', null)
      .in('status', ['interview', 'offer', 'rejected']);

    // Calculate average response times from historical data
    let avgResponseDays = 7; // Default
    const responseTimes: number[] = [];

    if (historicalJobs && historicalJobs.length > 0) {
      for (const hJob of historicalJobs) {
        if (hJob.applied_at && hJob.status_updated_at) {
          const applied = new Date(hJob.applied_at);
          const responded = new Date(hJob.status_updated_at);
          const days = Math.ceil((responded.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
          if (days > 0 && days < 90) {
            responseTimes.push(days);
          }
        }
      }

      if (responseTimes.length > 0) {
        avgResponseDays = Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length);
      }
    }

    // Prediction factors
    const factors: Record<string, any> = {};
    let adjustedDays = avgResponseDays;

    // Company size factor
    if (job.company_size) {
      if (job.company_size.includes('1000') || job.company_size.includes('enterprise')) {
        adjustedDays += 3;
        factors.company_size = '+3 days (large company)';
      } else if (job.company_size.includes('startup') || job.company_size.includes('1-50')) {
        adjustedDays -= 2;
        factors.company_size = '-2 days (startup)';
      }
    }

    // Day of week applied
    const appliedDate = job.applied_at ? new Date(job.applied_at) : new Date();
    const dayOfWeek = appliedDate.getDay();
    if (dayOfWeek === 5 || dayOfWeek === 6) { // Friday or Saturday
      adjustedDays += 2;
      factors.day_applied = '+2 days (weekend application)';
    }

    // Season/holiday factor
    const month = appliedDate.getMonth();
    if (month === 11 || month === 0) { // December or January
      adjustedDays += 5;
      factors.seasonality = '+5 days (holiday season)';
    } else if (month === 7) { // August
      adjustedDays += 3;
      factors.seasonality = '+3 days (summer vacation)';
    }

    // Calculate confidence interval
    const stdDev = responseTimes.length > 1 
      ? Math.sqrt(responseTimes.reduce((sum, val) => sum + Math.pow(val - avgResponseDays, 2), 0) / responseTimes.length)
      : 3;
    
    const confidenceLow = Math.max(1, Math.round(adjustedDays - stdDev));
    const confidenceHigh = Math.round(adjustedDays + stdDev * 1.5);

    // Calculate suggested follow-up date
    const followUpDate = new Date(appliedDate);
    followUpDate.setDate(followUpDate.getDate() + adjustedDays + 2);

    // Check if overdue
    const daysSinceApplied = job.applied_at 
      ? Math.ceil((Date.now() - new Date(job.applied_at).getTime()) / (1000 * 60 * 60 * 24))
      : 0;
    const isOverdue = daysSinceApplied > confidenceHigh;

    // Save prediction
    const prediction = {
      user_id: user.id,
      job_id: jobId,
      predicted_days: adjustedDays,
      confidence_interval_low: confidenceLow,
      confidence_interval_high: confidenceHigh,
      prediction_factors: factors,
      is_overdue: isOverdue,
      suggested_followup_date: followUpDate.toISOString().split('T')[0]
    };

    await supabase
      .from('response_time_predictions')
      .upsert(prediction, { onConflict: 'user_id,job_id' });

    return new Response(
      JSON.stringify({ 
        prediction: {
          ...prediction,
          days_since_applied: daysSinceApplied,
          message: isOverdue 
            ? `This application is overdue for a response. Consider following up.`
            : `Typically responds in ${confidenceLow}-${confidenceHigh} days. You should hear back around ${followUpDate.toLocaleDateString()}.`,
          industry_benchmark: `Based on ${responseTimes.length || 'limited'} historical applications`
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in response-time-prediction:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});