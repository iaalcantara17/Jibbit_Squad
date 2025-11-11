import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationRule {
  id: string;
  user_id: string;
  rule_type: string;
  trigger_conditions: any;
  action_config: any;
  is_active: boolean;
  last_executed_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    console.log('Fetching active automation rules...');
    
    // Get all active automation rules
    const { data: rules, error: rulesError } = await supabaseClient
      .from('automation_rules')
      .select('*')
      .eq('is_active', true);

    if (rulesError) {
      console.error('Error fetching rules:', rulesError);
      throw rulesError;
    }

    console.log(`Found ${rules?.length || 0} active rules to process`);

    const results = [];

    for (const rule of rules || []) {
      try {
        console.log(`Processing rule ${rule.id} (${rule.rule_type}) for user ${rule.user_id}`);
        
        const result = await executeRule(rule, supabaseClient);
        results.push({ ruleId: rule.id, success: true, result });

        // Update last_executed_at
        await supabaseClient
          .from('automation_rules')
          .update({ last_executed_at: new Date().toISOString() })
          .eq('id', rule.id);

      } catch (error) {
        console.error(`Error executing rule ${rule.id}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        results.push({ ruleId: rule.id, success: false, error: errorMessage });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processedRules: results.length,
        results 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in execute-automation-rules:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function executeRule(rule: AutomationRule, supabaseClient: any) {
  const { rule_type, trigger_conditions, action_config, user_id } = rule;

  switch (rule_type) {
    case 'generate_package':
      return await generateApplicationPackage(user_id, trigger_conditions, action_config, supabaseClient);
    
    case 'follow_up_reminder':
      return await sendFollowUpReminder(user_id, trigger_conditions, action_config, supabaseClient);
    
    case 'deadline_reminder':
      return await checkDeadlineReminders(user_id, trigger_conditions, action_config, supabaseClient);
    
    case 'status_update':
      return await performStatusUpdate(user_id, trigger_conditions, action_config, supabaseClient);
    
    default:
      throw new Error(`Unknown rule type: ${rule_type}`);
  }
}

async function generateApplicationPackage(
  userId: string, 
  conditions: any, 
  config: any, 
  supabase: any
) {
  console.log(`Generating application package for user ${userId}`);
  
  // Get jobs matching conditions
  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('status', conditions.status || 'Interested')
    .limit(10);

  if (jobsError) throw jobsError;

  const packages = [];

  for (const job of jobs || []) {
    try {
      // Generate resume for this job
      const { data: resumeData } = await supabase.functions.invoke('ai-resume-generate', {
        body: { 
          jobId: job.id,
          userId: userId,
          templateId: config.template_id || 'default'
        }
      });

      // Generate cover letter for this job
      const { data: coverLetterData } = await supabase.functions.invoke('ai-cover-letter-generate', {
        body: { 
          jobId: job.id,
          userId: userId,
          tone: config.cover_letter_tone || 'professional'
        }
      });

      packages.push({
        jobId: job.id,
        jobTitle: job.job_title,
        company: job.company,
        resume: resumeData,
        coverLetter: coverLetterData
      });

    } catch (error) {
      console.error(`Error generating package for job ${job.id}:`, error);
    }
  }

  return { packagesGenerated: packages.length, packages };
}

async function sendFollowUpReminder(
  userId: string, 
  conditions: any, 
  config: any, 
  supabase: any
) {
  console.log(`Checking follow-up reminders for user ${userId}`);
  
  const daysSinceApplied = conditions.days_since_applied || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysSinceApplied);

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'Applied')
    .lt('created_at', cutoffDate.toISOString());

  if (error) throw error;

  if (jobs && jobs.length > 0) {
    // Send notification email
    await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: userId,
        subject: 'Follow-up Reminders',
        message: `You have ${jobs.length} applications that may need follow-up`,
        jobs: jobs.map((j: any) => ({ id: j.id, title: j.job_title, company: j.company }))
      }
    });

    return { remindersSent: jobs.length };
  }

  return { remindersSent: 0 };
}

async function checkDeadlineReminders(
  userId: string, 
  conditions: any, 
  config: any, 
  supabase: any
) {
  console.log(`Checking deadline reminders for user ${userId}`);
  
  const daysBeforeDeadline = conditions.days_before_deadline || 3;
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysBeforeDeadline);

  const { data: jobs, error } = await supabase
    .from('jobs')
    .select('*')
    .eq('user_id', userId)
    .gte('application_deadline', today.toISOString())
    .lte('application_deadline', futureDate.toISOString())
    .neq('status', 'Rejected')
    .eq('is_archived', false);

  if (error) throw error;

  if (jobs && jobs.length > 0) {
    // Send notification
    await supabase.functions.invoke('send-notification-email', {
      body: {
        userId: userId,
        subject: 'Upcoming Application Deadlines',
        message: `You have ${jobs.length} application deadlines approaching`,
        jobs: jobs.map((j: any) => ({ 
          id: j.id, 
          title: j.job_title, 
          company: j.company,
          deadline: j.application_deadline
        }))
      }
    });

    return { deadlineReminders: jobs.length };
  }

  return { deadlineReminders: 0 };
}

async function performStatusUpdate(
  userId: string, 
  conditions: any, 
  config: any, 
  supabase: any
) {
  console.log(`Performing status updates for user ${userId}`);
  
  // Auto-archive old rejected applications
  if (config.action === 'archive_rejected') {
    const daysOld = config.days_old || 30;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data: jobs, error } = await supabase
      .from('jobs')
      .update({ is_archived: true })
      .eq('user_id', userId)
      .eq('status', 'Rejected')
      .lt('updated_at', cutoffDate.toISOString())
      .select();

    if (error) throw error;

    return { jobsArchived: jobs?.length || 0 };
  }

  return { statusUpdates: 0 };
}
