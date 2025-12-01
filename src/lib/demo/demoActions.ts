/**
 * Sprint 3 Demo Actions Registry
 * Defines all demo actions with verification functions
 */

import { supabase } from '@/integrations/supabase/client';

export interface DemoAction {
  id: string;
  act: string;
  label: string;
  goToRoute: string;
  whatToShow: string[];
  verifyFn: (userId: string) => Promise<{ pass: boolean; message: string }>;
}

export const DEMO_ACTIONS: DemoAction[] = [
  // ACT 1: INTERVIEW PREP
  {
    id: 'schedule_interview',
    act: 'Act 1: Interview Prep',
    label: 'Schedule interview from job application',
    goToRoute: '/jobs',
    whatToShow: [
      'Click job card → "Schedule Interview"',
      'Calendar integration auto-sync',
      'In-app reminder system',
    ],
    verifyFn: async (userId) => {
      const { data: jobs } = await supabase.from('jobs').select('id').eq('user_id', userId).limit(1);
      const { data: interviews } = await supabase.from('interviews').select('id').eq('user_id', userId).limit(1);
      if (!jobs || jobs.length === 0) return { pass: false, message: 'No jobs exist. Run "Load Demo Data".' };
      if (!interviews || interviews.length === 0) return { pass: false, message: 'No interviews scheduled. Run "Load Demo Data".' };
      return { pass: true, message: 'Jobs and interviews exist.' };
    },
  },
  {
    id: 'company_research',
    act: 'Act 1: Interview Prep',
    label: 'View company research report',
    goToRoute: '/interview-prep',
    whatToShow: [
      'Select upcoming interview',
      'View generated research with sources',
      'Recent news, key people, culture',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('company_research').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No company research. Run "Load Demo Data".' };
      return { pass: true, message: 'Company research exists.' };
    },
  },
  {
    id: 'question_bank',
    act: 'Act 1: Interview Prep',
    label: 'Browse question bank',
    goToRoute: '/question-bank',
    whatToShow: [
      'Filter by role/category/difficulty',
      'View STAR framework hints',
      'Click question to practice',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('question_bank_items').select('id').limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'Question bank empty. Run "Load Demo Data".' };
      return { pass: true, message: `Question bank has ${data.length}+ items.` };
    },
  },
  {
    id: 'submit_response',
    act: 'Act 1: Interview Prep',
    label: 'Submit response & receive feedback',
    goToRoute: '/question-bank',
    whatToShow: [
      'Select question → Practice',
      'Submit written response',
      'View AI/rubric feedback with scores',
    ],
    verifyFn: async (userId) => {
      const { data: responses } = await supabase.from('question_practice_responses').select('id').eq('user_id', userId).limit(1);
      const { data: feedback } = await supabase.from('question_practice_feedback').select('id').limit(1);
      if (!responses || responses.length === 0) return { pass: false, message: 'No practice responses. Run "Load Demo Data".' };
      if (!feedback || feedback.length === 0) return { pass: false, message: 'No feedback exists. Run "Load Demo Data".' };
      return { pass: true, message: 'Practice responses and feedback exist.' };
    },
  },
  {
    id: 'mock_interview',
    act: 'Act 1: Interview Prep',
    label: 'Mock interview performance summary',
    goToRoute: '/interview-prep',
    whatToShow: [
      'Start mock interview setup',
      'Complete session (seeded)',
      'View performance summary & insights',
    ],
    verifyFn: async (userId) => {
      const { data: sessions } = await supabase.from('mock_interview_sessions').select('id').eq('user_id', userId).eq('status', 'completed').limit(1);
      const { data: summaries } = await supabase.from('mock_interview_summaries').select('id').limit(1);
      if (!sessions || sessions.length === 0) return { pass: false, message: 'No completed mock sessions. Run "Load Demo Data".' };
      if (!summaries || summaries.length === 0) return { pass: false, message: 'No mock summaries. Run "Load Demo Data".' };
      return { pass: true, message: 'Completed mock interview with summary exists.' };
    },
  },
  {
    id: 'technical_prep',
    act: 'Act 1: Interview Prep',
    label: 'Technical prep & coding challenges',
    goToRoute: '/technical-prep',
    whatToShow: [
      'Browse coding challenges',
      'View saved attempt (seeded)',
      'Review feedback framework',
    ],
    verifyFn: async (userId) => {
      const { data: challenges } = await supabase.from('technical_challenges').select('id').limit(1);
      const { data: attempts } = await supabase.from('technical_practice_attempts').select('id').eq('user_id', userId).limit(1);
      if (!challenges || challenges.length === 0) return { pass: false, message: 'No technical challenges. Run "Load Demo Data".' };
      if (!attempts || attempts.length === 0) return { pass: false, message: 'No practice attempts. Run "Load Demo Data".' };
      return { pass: true, message: 'Technical challenges and attempts exist.' };
    },
  },
  {
    id: 'interview_checklist',
    act: 'Act 1: Interview Prep',
    label: 'Interview preparation checklist',
    goToRoute: '/interview-prep',
    whatToShow: [
      'Open interview → Checklist tab',
      'Mark items complete',
      'Add custom items',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('interview_checklists').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No checklists. Run "Load Demo Data".' };
      return { pass: true, message: 'Interview checklists exist.' };
    },
  },
  {
    id: 'interview_analytics',
    act: 'Act 1: Interview Prep',
    label: 'Interview analytics dashboard',
    goToRoute: '/interview-analytics',
    whatToShow: [
      'View interview success trends',
      'Performance by type/company',
      'Preparation time correlation',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('interviews').select('id').eq('user_id', userId);
      if (!data || data.length < 2) return { pass: false, message: 'Need 2+ interviews for analytics. Run "Load Demo Data".' };
      return { pass: true, message: `${data.length} interviews for analytics.` };
    },
  },
  {
    id: 'followup_templates',
    act: 'Act 1: Interview Prep',
    label: 'Generate/send follow-up',
    goToRoute: '/interview-prep',
    whatToShow: [
      'Select completed interview',
      'Generate thank-you note',
      'Track send status',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('interview_followups').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No follow-ups. Run "Load Demo Data".' };
      return { pass: true, message: 'Follow-up templates exist.' };
    },
  },
  {
    id: 'salary_negotiation',
    act: 'Act 1: Interview Prep',
    label: 'Salary negotiation prep',
    goToRoute: '/jobs',
    whatToShow: [
      'Open job with offer status',
      'View market range with sources',
      'Confidence checklist & talking points',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('offers').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No offers. Run "Load Demo Data".' };
      return { pass: true, message: 'Offer data exists.' };
    },
  },

  // ACT 2: NETWORK
  {
    id: 'linkedin_signin',
    act: 'Act 2: Network',
    label: 'LinkedIn profile connection',
    goToRoute: '/profile?section=basic',
    whatToShow: [
      'Navigate to Profile',
      'LinkedIn URL field (manual)',
      'Profile headline imported',
    ],
    verifyFn: async () => {
      // LinkedIn OAuth not configured, fallback is manual field
      return { pass: true, message: 'Manual LinkedIn connection available (OAuth not configured).' };
    },
  },
  {
    id: 'manage_contacts',
    act: 'Act 2: Network',
    label: 'Add/manage contacts',
    goToRoute: '/contacts',
    whatToShow: [
      'View contact list',
      'Relationship strength ratings',
      'Tags and categorization',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('contacts').select('id').eq('user_id', userId);
      if (!data || data.length === 0) return { pass: false, message: 'No contacts. Run "Load Demo Data".' };
      return { pass: true, message: `${data.length} contacts exist.` };
    },
  },
  {
    id: 'referral_request',
    act: 'Act 2: Network',
    label: 'Request referral',
    goToRoute: '/contacts',
    whatToShow: [
      'Select contact → Request Referral',
      'Link to job application',
      'Track status and follow-ups',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('referral_requests').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No referral requests. Run "Load Demo Data".' };
      return { pass: true, message: 'Referral requests exist.' };
    },
  },
  {
    id: 'networking_event',
    act: 'Act 2: Network',
    label: 'Add networking event',
    goToRoute: '/events',
    whatToShow: [
      'Add event with goals',
      'Track connections made',
      'Log follow-up actions',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('networking_events').select('id').eq('user_id', userId);
      if (!data || data.length === 0) return { pass: false, message: 'No networking events. Run "Load Demo Data".' };
      return { pass: true, message: `${data.length} networking events exist.` };
    },
  },
  {
    id: 'informational_interview',
    act: 'Act 2: Network',
    label: 'Informational interview',
    goToRoute: '/network-power',
    whatToShow: [
      'Request informational interview',
      'Prep framework and questions',
      'Track outcome and follow-ups',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('informational_interviews').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No informational interviews. Run "Load Demo Data".' };
      return { pass: true, message: 'Informational interviews exist.' };
    },
  },
  {
    id: 'suggested_contacts',
    act: 'Act 2: Network',
    label: 'Suggested industry contacts',
    goToRoute: '/contacts',
    whatToShow: [
      'View contacts sorted by strength',
      'Filter by industry/company',
      'Initiate outreach',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('contacts').select('id').eq('user_id', userId);
      if (!data || data.length < 3) return { pass: false, message: 'Need 3+ contacts. Run "Load Demo Data".' };
      return { pass: true, message: 'Contacts available for filtering.' };
    },
  },
  {
    id: 'relationship_maintenance',
    act: 'Act 2: Network',
    label: 'Relationship maintenance reminders',
    goToRoute: '/network-power',
    whatToShow: [
      'View maintenance tab',
      'Suggested outreach reminders',
      'Track engagement',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('contact_reminders').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No reminders. Run "Load Demo Data".' };
      return { pass: true, message: 'Contact reminders exist.' };
    },
  },
  {
    id: 'references_manager',
    act: 'Act 2: Network',
    label: 'Manage reference list',
    goToRoute: '/network-power',
    whatToShow: [
      'View references tab',
      'Request reference for job',
      'Track completion',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('professional_references').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No references. Run "Load Demo Data".' };
      return { pass: true, message: 'Professional references exist.' };
    },
  },

  // ACT 3: ANALYTICS
  {
    id: 'performance_dashboard',
    act: 'Act 3: Analytics',
    label: 'Performance dashboard',
    goToRoute: '/analytics',
    whatToShow: [
      'View key metrics and trends',
      'Application velocity',
      'Response rate over time',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('jobs').select('id').eq('user_id', userId);
      if (!data || data.length < 3) return { pass: false, message: 'Need 3+ jobs for analytics. Run "Load Demo Data".' };
      return { pass: true, message: `${data.length} jobs for analytics.` };
    },
  },
  {
    id: 'application_success',
    act: 'Act 3: Analytics',
    label: 'Application success rate analysis',
    goToRoute: '/application-success',
    whatToShow: [
      'Funnel visualization',
      'Conversion metrics by stage',
      'Success patterns',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('jobs').select('id, status').eq('user_id', userId);
      if (!data || data.length < 4) return { pass: false, message: 'Need 4+ jobs across stages. Run "Load Demo Data".' };
      return { pass: true, message: 'Sufficient data for funnel analysis.' };
    },
  },
  {
    id: 'interview_success_metrics',
    act: 'Act 3: Analytics',
    label: 'Interview success metrics',
    goToRoute: '/interview-performance',
    whatToShow: [
      'Success rate by interview type',
      'Preparation correlation',
      'Patterns and insights',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('interviews').select('id').eq('user_id', userId);
      if (!data || data.length < 2) return { pass: false, message: 'Need 2+ interviews. Run "Load Demo Data".' };
      return { pass: true, message: 'Interview data exists for analysis.' };
    },
  },
  {
    id: 'skills_demand',
    act: 'Act 3: Analytics',
    label: 'Skills demand analysis',
    goToRoute: '/analytics',
    whatToShow: [
      'Skills from job postings',
      'Your skills vs. demand',
      'Gap identification',
    ],
    verifyFn: async (userId) => {
      const { data: jobs } = await supabase.from('jobs').select('id, job_description').eq('user_id', userId);
      const { data: profile } = await supabase.from('profiles').select('skills').eq('user_id', userId).single();
      if (!jobs || jobs.length < 3) return { pass: false, message: 'Need 3+ jobs with descriptions. Run "Load Demo Data".' };
      return { pass: true, message: 'Job descriptions available for skills analysis.' };
    },
  },
  {
    id: 'network_analytics',
    act: 'Act 3: Analytics',
    label: 'Network analytics',
    goToRoute: '/network-roi',
    whatToShow: [
      'Relationship health metrics',
      'Engagement over time',
      'ROI tracking',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('contacts').select('id').eq('user_id', userId);
      if (!data || data.length < 3) return { pass: false, message: 'Need 3+ contacts for analytics. Run "Load Demo Data".' };
      return { pass: true, message: 'Contact data for network analytics.' };
    },
  },
  {
    id: 'time_allocation',
    act: 'Act 3: Analytics',
    label: 'Time allocation analysis',
    goToRoute: '/time-investment',
    whatToShow: [
      'Activity breakdown',
      'Time per application stage',
      'Efficiency insights',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('time_tracking').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No time tracking data. Run "Load Demo Data".' };
      return { pass: true, message: 'Time tracking data exists.' };
    },
  },
  {
    id: 'salary_analytics',
    act: 'Act 3: Analytics',
    label: 'Salary analytics',
    goToRoute: '/salary-progression',
    whatToShow: [
      'Offer progression',
      'Comparison vs. market ranges',
      'Negotiation outcomes',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('offers').select('id').eq('user_id', userId);
      if (!data || data.length === 0) return { pass: false, message: 'No offers. Run "Load Demo Data".' };
      return { pass: true, message: `${data.length} offer(s) for salary analytics.` };
    },
  },
  {
    id: 'goal_tracking',
    act: 'Act 3: Analytics',
    label: 'Goal tracking dashboard',
    goToRoute: '/goals',
    whatToShow: [
      'Active goals with milestones',
      'Progress visualization',
      'Celebrate completions',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('goals').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No goals. Run "Load Demo Data".' };
      return { pass: true, message: 'Goals exist for tracking.' };
    },
  },

  // ACT 4: COLLABORATION
  {
    id: 'create_team',
    act: 'Act 4: Collaboration',
    label: 'Create team & invite member',
    goToRoute: '/teams',
    whatToShow: [
      'Create team button',
      'Invite via email',
      'View roles/permissions',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('teams').select('id').eq('created_by', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No team. Create one or run "Load Demo Data" (note: invite requires manual email).' };
      return { pass: true, message: 'Team exists. Invite requires valid email address.' };
    },
  },
  {
    id: 'team_dashboard',
    act: 'Act 4: Collaboration',
    label: 'Team dashboard',
    goToRoute: '/teams',
    whatToShow: [
      'Select team',
      'View aggregate stats',
      'Member progress overview',
    ],
    verifyFn: async (userId) => {
      const { data: memberships } = await supabase.from('team_memberships').select('team_id').eq('user_id', userId).limit(1);
      if (!memberships || memberships.length === 0) return { pass: false, message: 'Not part of any team. Create one or accept invite.' };
      return { pass: true, message: 'Team membership exists.' };
    },
  },
  {
    id: 'share_job',
    act: 'Act 4: Collaboration',
    label: 'Share job posting with team',
    goToRoute: '/jobs',
    whatToShow: [
      'Job card → Share with team',
      'Add comments',
      'Team members can view',
    ],
    verifyFn: async (userId) => {
      const { data: jobs } = await supabase.from('jobs').select('id').eq('user_id', userId).limit(1);
      const { data: teams } = await supabase.from('team_memberships').select('team_id').eq('user_id', userId).limit(1);
      if (!jobs || jobs.length === 0) return { pass: false, message: 'No jobs. Run "Load Demo Data".' };
      if (!teams || teams.length === 0) return { pass: false, message: 'No team membership.' };
      return { pass: true, message: 'Jobs and team available for sharing.' };
    },
  },
  {
    id: 'mentor_feedback',
    act: 'Act 4: Collaboration',
    label: 'Mentor feedback flow',
    goToRoute: '/mentor-dashboard',
    whatToShow: [
      'View mentee progress',
      'Provide feedback on resume/job',
      'Assign tasks (if available)',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('team_memberships').select('role').eq('user_id', userId).eq('role', 'mentor').limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'User must have mentor role in a team.' };
      return { pass: true, message: 'Mentor role exists.' };
    },
  },
  {
    id: 'team_activity_feed',
    act: 'Act 4: Collaboration',
    label: 'Team activity feed',
    goToRoute: '/teams',
    whatToShow: [
      'Recent milestones',
      'Member activities',
      'Celebrations',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('team_memberships').select('team_id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'Not part of any team.' };
      return { pass: true, message: 'Team membership for activity feed.' };
    },
  },
  {
    id: 'team_performance',
    act: 'Act 4: Collaboration',
    label: 'Team performance comparison',
    goToRoute: '/teams',
    whatToShow: [
      'Within-team benchmarking',
      'Anonymized if configured',
      'Progress comparison',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('team_memberships').select('team_id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'Not part of any team.' };
      return { pass: true, message: 'Team data available for comparison.' };
    },
  },

  // ACT 5: ADVANCED & QA
  {
    id: 'document_management',
    act: 'Act 5: Advanced',
    label: 'Document management',
    goToRoute: '/resumes',
    whatToShow: [
      'Organize resumes/cover letters',
      'Version control',
      'Track materials usage',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('resumes').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No resumes. Create one in /resumes.' };
      return { pass: true, message: 'Resume documents exist.' };
    },
  },
  {
    id: 'export_report',
    act: 'Act 5: Advanced',
    label: 'Export comprehensive report',
    goToRoute: '/custom-reports',
    whatToShow: [
      'Print-friendly report (PDF not configured)',
      'Job search summary',
      'Analytics snapshot',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('jobs').select('id').eq('user_id', userId);
      if (!data || data.length < 3) return { pass: false, message: 'Need 3+ jobs for report. Run "Load Demo Data".' };
      return { pass: true, message: 'Sufficient data for export. PDF not configured; print-friendly available.' };
    },
  },
  {
    id: 'ai_recommendations',
    act: 'Act 5: Advanced',
    label: 'AI recommendations',
    goToRoute: '/analytics',
    whatToShow: [
      'Next action suggestions',
      'Priority ranking (rules-based)',
      'Personalized insights',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('jobs').select('id').eq('user_id', userId);
      if (!data || data.length < 2) return { pass: false, message: 'Need 2+ jobs for recommendations. Run "Load Demo Data".' };
      return { pass: true, message: 'Rules-based recommendations available (AI not fully configured).' };
    },
  },
  {
    id: 'predictive_analytics',
    act: 'Act 5: Advanced',
    label: 'Predictive analytics',
    goToRoute: '/forecasting',
    whatToShow: [
      'Forecast based on user data',
      'Confidence intervals',
      'Scenario planning',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('jobs').select('id, status').eq('user_id', userId);
      if (!data || data.length < 5) return { pass: false, message: 'Need 5+ jobs for forecasting. Run "Load Demo Data".' };
      return { pass: true, message: 'Sufficient data for honest forecasting.' };
    },
  },
  {
    id: 'mobile_responsive',
    act: 'Act 5: QA',
    label: 'Mobile responsiveness',
    goToRoute: '/',
    whatToShow: [
      'Resize browser window',
      'Test navigation',
      'Verify layouts adapt',
    ],
    verifyFn: async () => {
      return { pass: true, message: 'Responsive design implemented. Test manually.' };
    },
  },
  {
    id: 'test_suite',
    act: 'Act 5: QA',
    label: 'Test suite & coverage',
    goToRoute: '/demo/sprint3',
    whatToShow: [
      'Show test commands in README',
      'Point to /src/test directory',
      'Note: do not fake execution',
    ],
    verifyFn: async () => {
      return { pass: true, message: 'Test suite exists in repo. Run: npm test (not executed here).' };
    },
  },
];
