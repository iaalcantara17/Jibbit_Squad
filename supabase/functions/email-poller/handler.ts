// Pure email polling logic - fully testable

export type EmailMessage = {
  id: string;
  subject: string;
  snippet: string;
  from: string;
  date: string;
};

export type PollerDeps = {
  supabase: {
    upsertEmail: (userId: string, msg: EmailMessage, status: string | null) => Promise<'inserted' | 'updated' | 'skipped'>;
    matchJob: (userId: string, msg: EmailMessage) => Promise<string | null>;
    updateJobStatus: (jobId: string, status: string, date: Date) => Promise<void>;
  };
  gmail: {
    listMessages: (sinceIso: string) => Promise<EmailMessage[]>;
  };
  userId: string;
  now: Date;
};

export type PollerResult = {
  inserted: number;
  updated: number;
  skipped: number;
  detectedCount: number;
};

/**
 * Detect application status from email content
 * Returns null if no status pattern matches
 */
export function detectStatus(text: string): 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected' | null {
  const t = text.toLowerCase();
  
  // Applied
  if (/(thanks for applying|received your application|application submitted|we have received)/.test(t)) {
    return 'Applied';
  }
  
  // Phone Screen
  if (/(phone screen|recruiter call|initial conversation|screening call)/.test(t)) {
    return 'Phone Screen';
  }
  
  // Interview
  if (/(interview|onsite|virtual interview|interview invitation|schedule.*interview)/.test(t)) {
    return 'Interview';
  }
  
  // Offer
  if (/(offer|offer letter|compensation package|employment offer|job offer)/.test(t)) {
    return 'Offer';
  }
  
  // Rejected
  if (/(regret|unfortunately|not moving forward|decided to pursue|not selected|application.*unsuccessful)/.test(t)) {
    return 'Rejected';
  }
  
  return null;
}

/**
 * Poll emails from the last 14 days and update job statuses
 * Deduplicates by (user_id, provider_msg_id)
 */
export async function runEmailPoller(deps: PollerDeps): Promise<PollerResult> {
  const { supabase, gmail, userId, now } = deps;
  
  // Fetch emails from last 14 days
  const since = new Date(now);
  since.setDate(since.getDate() - 14);
  
  const messages = await gmail.listMessages(since.toISOString());
  
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let detectedCount = 0;
  
  for (const msg of messages) {
    const fullText = `${msg.subject} ${msg.snippet}`;
    const detectedStatus = detectStatus(fullText);
    
    // Always upsert to email_tracking (dedupe by provider_msg_id)
    const upsertResult = await supabase.upsertEmail(userId, msg, detectedStatus);
    
    if (upsertResult === 'skipped') {
      skipped++;
      continue;
    }
    
    if (upsertResult === 'inserted') inserted++;
    if (upsertResult === 'updated') updated++;
    
    // If status detected, try to match to a job
    if (detectedStatus) {
      detectedCount++;
      const jobId = await supabase.matchJob(userId, msg);
      
      if (jobId) {
        // Update job status and history
        await supabase.updateJobStatus(jobId, detectedStatus, new Date(msg.date));
      }
    }
  }
  
  return { inserted, updated, skipped, detectedCount };
}
