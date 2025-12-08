import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// UC-118: Smart Follow-Up Reminder System
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

    const { action, jobId, reminderId } = await req.json();

    switch (action) {
      case 'generate_reminders': {
        // Get user's jobs that need follow-up
        const { data: jobs } = await supabase
          .from('jobs')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_archived', false)
          .in('status', ['applied', 'phone_screen', 'interview']);

        const reminders = [];

        for (const job of jobs || []) {
          const daysSinceUpdate = Math.floor(
            (Date.now() - new Date(job.status_updated_at || job.created_at).getTime()) / (1000 * 60 * 60 * 24)
          );

          let shouldRemind = false;
          let reminderType = '';
          let template = '';

          if (job.status === 'applied' && daysSinceUpdate >= 7) {
            shouldRemind = true;
            reminderType = 'application_followup';
            template = generateFollowupTemplate('application', job);
          } else if (job.status === 'phone_screen' && daysSinceUpdate >= 3) {
            shouldRemind = true;
            reminderType = 'phone_screen_followup';
            template = generateFollowupTemplate('phone_screen', job);
          } else if (job.status === 'interview' && daysSinceUpdate >= 2) {
            shouldRemind = true;
            reminderType = 'interview_followup';
            template = generateFollowupTemplate('interview', job);
          }

          if (shouldRemind) {
            // Check if reminder already exists
            const { data: existing } = await supabase
              .from('follow_up_reminders')
              .select('id')
              .eq('job_id', job.id)
              .eq('reminder_type', reminderType)
              .is('completed_at', null)
              .is('dismissed_at', null)
              .single();

            if (!existing) {
              const reminder = {
                user_id: user.id,
                job_id: job.id,
                reminder_type: reminderType,
                scheduled_date: new Date().toISOString(),
                email_template: template,
                auto_generated: true
              };

              const { data: created } = await supabase
                .from('follow_up_reminders')
                .insert(reminder)
                .select()
                .single();

              if (created) reminders.push({ ...created, job });
            }
          }
        }

        return new Response(
          JSON.stringify({ 
            reminders,
            tips: getFollowupTips()
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'snooze': {
        if (!reminderId) {
          return new Response(
            JSON.stringify({ error: 'Reminder ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const snoozedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

        await supabase
          .from('follow_up_reminders')
          .update({ snoozed_until: snoozedUntil })
          .eq('id', reminderId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true, snoozed_until: snoozedUntil }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'dismiss': {
        if (!reminderId) {
          return new Response(
            JSON.stringify({ error: 'Reminder ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('follow_up_reminders')
          .update({ dismissed_at: new Date().toISOString() })
          .eq('id', reminderId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'complete': {
        if (!reminderId) {
          return new Response(
            JSON.stringify({ error: 'Reminder ID required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        await supabase
          .from('follow_up_reminders')
          .update({ completed_at: new Date().toISOString() })
          .eq('id', reminderId)
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'get_pending': {
        const { data: reminders } = await supabase
          .from('follow_up_reminders')
          .select(`
            *,
            jobs:job_id (
              id,
              job_title,
              company_name,
              status
            )
          `)
          .eq('user_id', user.id)
          .is('completed_at', null)
          .is('dismissed_at', null)
          .or(`snoozed_until.is.null,snoozed_until.lt.${new Date().toISOString()}`)
          .order('scheduled_date', { ascending: true });

        return new Response(
          JSON.stringify({ reminders: reminders || [] }),
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
    console.error('Error in smart-followup:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateFollowupTemplate(stage: string, job: any): string {
  const templates: Record<string, string> = {
    application: `Subject: Following Up on ${job.job_title} Application

Dear Hiring Team,

I hope this email finds you well. I wanted to follow up on my application for the ${job.job_title} position at ${job.company_name}, submitted on [DATE].

I remain very interested in this opportunity and would welcome the chance to discuss how my experience and skills align with your team's needs.

Thank you for your time and consideration.

Best regards,
[YOUR NAME]`,

    phone_screen: `Subject: Thank You - ${job.job_title} Phone Screen Follow-up

Dear [INTERVIEWER NAME],

Thank you for taking the time to speak with me about the ${job.job_title} role at ${job.company_name}. I enjoyed learning more about the position and your team.

Our conversation reinforced my enthusiasm for this opportunity. Please let me know if there's any additional information I can provide.

Best regards,
[YOUR NAME]`,

    interview: `Subject: Thank You - ${job.job_title} Interview

Dear [INTERVIEWER NAME],

Thank you for the opportunity to interview for the ${job.job_title} position at ${job.company_name}. I appreciated the chance to learn more about [SPECIFIC TOPIC DISCUSSED].

I'm excited about the possibility of contributing to your team and look forward to hearing about next steps.

Best regards,
[YOUR NAME]`
  };

  return templates[stage] || templates.application;
}

function getFollowupTips(): string[] {
  return [
    "Follow up 1 week after submitting an application if you haven't heard back",
    "Send a thank-you email within 24 hours of an interview",
    "Keep follow-ups brief and professional - 2-3 paragraphs maximum",
    "Personalize each follow-up with specific details from your conversation",
    "Avoid following up more than twice for the same application stage",
    "Best times to send: Tuesday-Thursday, 9-11 AM local time",
    "Reference the specific position and date of your last interaction"
  ];
}
