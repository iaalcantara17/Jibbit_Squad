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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Starting daily notification check...');

    // Get all users with profiles (to get email)
    const { data: profiles, error: profilesError } = await supabaseClient
      .from('profiles')
      .select('user_id, email');

    if (profilesError) throw profilesError;

    let emailsSent = 0;
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    for (const profile of profiles || []) {
      if (!profile.email) continue;

      // Check for unread notifications
      const { data: unreadNotifications } = await supabaseClient
        .from('notifications')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('is_read', false)
        .eq('sent_via_email', false);

      if (!unreadNotifications || unreadNotifications.length === 0) continue;

      // Check for upcoming deadlines (next 3 days)
      const { data: upcomingJobs } = await supabaseClient
        .from('jobs')
        .select('*')
        .eq('user_id', profile.user_id)
        .eq('is_archived', false)
        .not('application_deadline', 'is', null);

      const now = new Date();
      const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      
      const urgentJobs = (upcomingJobs || []).filter(job => {
        if (!job.application_deadline) return false;
        const deadline = new Date(job.application_deadline);
        return deadline >= now && deadline <= threeDaysFromNow;
      });

      // Check for upcoming interviews (next 7 days)
      const { data: upcomingInterviews } = await supabaseClient
        .from('interviews')
        .select('*, jobs(job_title, company_name)')
        .eq('user_id', profile.user_id)
        .gte('interview_date', now.toISOString())
        .lte('interview_date', new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString());

      // Build email content
      let emailContent = '<h2>Your JobHuntr Daily Summary</h2>';
      
      if (unreadNotifications.length > 0) {
        emailContent += `<p>You have <strong>${unreadNotifications.length}</strong> unread notification${unreadNotifications.length > 1 ? 's' : ''}.</p>`;
      }

      if (urgentJobs.length > 0) {
        emailContent += '<h3>🚨 Upcoming Application Deadlines</h3><ul>';
        urgentJobs.forEach(job => {
          const deadline = new Date(job.application_deadline);
          const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          emailContent += `<li><strong>${job.job_title}</strong> at ${job.company_name} - ${daysUntil} day${daysUntil !== 1 ? 's' : ''} remaining</li>`;
        });
        emailContent += '</ul>';
      }

      if (upcomingInterviews && upcomingInterviews.length > 0) {
        emailContent += '<h3>📅 Upcoming Interviews</h3><ul>';
        upcomingInterviews.forEach(interview => {
          const interviewDate = new Date(interview.interview_date);
          const job = interview.jobs as any;
          emailContent += `<li><strong>${job?.job_title}</strong> at ${job?.company_name} - ${interviewDate.toLocaleDateString()} at ${interviewDate.toLocaleTimeString()}</li>`;
        });
        emailContent += '</ul>';
      }

      emailContent += '<p><a href="https://your-app.lovable.app/dashboard" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">View Dashboard</a></p>';

      // Send email via Resend
      if (RESEND_API_KEY) {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'JobHuntr <onboarding@resend.dev>',
            to: [profile.email],
            subject: 'Your Daily JobHuntr Summary',
            html: emailContent,
          }),
        });

        if (emailResponse.ok) {
          // Mark notifications as sent via email
          await supabaseClient
            .from('notifications')
            .update({ sent_via_email: true })
            .eq('user_id', profile.user_id)
            .eq('sent_via_email', false);

          emailsSent++;
          console.log(`Email sent to ${profile.email}`);
        }
      }
    }

    console.log(`Daily notifications completed. Emails sent: ${emailsSent}`);

    return new Response(
      JSON.stringify({ success: true, emailsSent }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Daily notifications error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
