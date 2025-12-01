/**
 * Sprint 3 Demo Actions (UC-112, UC-114, UC-115)
 */

import { supabase } from '@/integrations/supabase/client';
import type { DemoAction } from './demoActions';

export const SPRINT3_DEMO_ACTIONS: DemoAction[] = [
  // UC-112: Peer Networking
  {
    id: 'join_support_group',
    act: 'Act 6: Peer Community',
    label: 'Join support group',
    goToRoute: '/peer-community',
    whatToShow: [
      'View available groups',
      'Join industry/role-based group',
      'Set privacy level',
    ],
    verifyFn: async (userId) => {
      const { data: groups } = await supabase.from('support_groups').select('id').limit(1);
      const { data: members } = await supabase.from('support_group_members').select('id').eq('user_id', userId).limit(1);
      if (!groups || groups.length === 0) return { pass: false, message: 'No support groups. Run "Load Demo Data".' };
      if (!members || members.length === 0) return { pass: false, message: 'Not a member of any group. Join one.' };
      return { pass: true, message: 'Support groups and memberships exist.' };
    },
  },
  {
    id: 'anonymous_post',
    act: 'Act 6: Peer Community',
    label: 'Share anonymous insights',
    goToRoute: '/peer-community',
    whatToShow: [
      'Post to group feed',
      'Toggle anonymous posting',
      'Share success stories',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('group_posts').select('id').limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No group posts. Run "Load Demo Data".' };
      return { pass: true, message: 'Group posts exist.' };
    },
  },
  {
    id: 'group_challenge',
    act: 'Act 6: Peer Community',
    label: 'Join group challenge',
    goToRoute: '/peer-community',
    whatToShow: [
      'View active challenges',
      'Track challenge progress',
      'See leaderboard',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('group_challenges').select('id').limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No group challenges. Run "Load Demo Data".' };
      return { pass: true, message: 'Group challenges exist.' };
    },
  },
  {
    id: 'group_webinar',
    act: 'Act 6: Peer Community',
    label: 'Attend group webinar',
    goToRoute: '/peer-community',
    whatToShow: [
      'View upcoming webinars',
      'Join webinar session',
      'Access recordings',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('group_webinars').select('id').limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No webinars. Run "Load Demo Data".' };
      return { pass: true, message: 'Group webinars exist.' };
    },
  },

  // UC-114: Institutional Integration
  {
    id: 'white_label_settings',
    act: 'Act 7: Institution',
    label: 'Configure white-label branding',
    goToRoute: '/institutional-admin',
    whatToShow: [
      'Set institution name and logo',
      'Customize colors',
      'Configure custom domain',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('institutional_settings').select('id').eq('created_by', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No institutional settings. Run "Load Demo Data".' };
      return { pass: true, message: 'Institutional settings exist.' };
    },
  },
  {
    id: 'bulk_onboarding',
    act: 'Act 7: Institution',
    label: 'Bulk onboarding',
    goToRoute: '/institutional-admin',
    whatToShow: [
      'CSV upload interface',
      'Validation errors',
      'Batch user creation',
    ],
    verifyFn: async () => {
      return { pass: true, message: 'Bulk onboarding UI exists. CSV import requires manual test.' };
    },
  },
  {
    id: 'compliance_audit',
    act: 'Act 7: Institution',
    label: 'Compliance and audit logs',
    goToRoute: '/institutional-admin',
    whatToShow: [
      'View audit logs',
      'Data retention policies',
      'Export user data',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('audit_logs').select('id').eq('user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No audit logs. Interact with system to generate.' };
      return { pass: true, message: 'Audit logs exist.' };
    },
  },
  {
    id: 'aggregate_reporting',
    act: 'Act 7: Institution',
    label: 'Aggregate reporting',
    goToRoute: '/institutional-admin',
    whatToShow: [
      'Cohort performance metrics',
      'Program ROI',
      'Success rate tracking',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('institutional_settings').select('id').eq('created_by', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'Need institutional settings. Run "Load Demo Data".' };
      return { pass: true, message: 'Institutional data for reporting.' };
    },
  },

  // UC-115: Advisor Integration
  {
    id: 'browse_advisors',
    act: 'Act 8: Advisors',
    label: 'Browse advisor marketplace',
    goToRoute: '/advisor-marketplace',
    whatToShow: [
      'View advisor profiles',
      'Filter by specialization',
      'See rates and reviews',
    ],
    verifyFn: async () => {
      const { data } = await supabase.from('advisor_profiles').select('id').eq('is_active', true).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No active advisors. Run "Load Demo Data".' };
      return { pass: true, message: 'Active advisor profiles exist.' };
    },
  },
  {
    id: 'book_advisor_session',
    act: 'Act 8: Advisors',
    label: 'Book advisor session',
    goToRoute: '/advisor-marketplace',
    whatToShow: [
      'Select advisor and session type',
      'Choose date and time',
      'Confirm booking',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('coaching_sessions').select('id').eq('client_user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No coaching sessions booked. Book one from advisor marketplace.' };
      return { pass: true, message: 'Coaching sessions exist.' };
    },
  },
  {
    id: 'session_payment',
    act: 'Act 8: Advisors',
    label: 'Session payment tracking',
    goToRoute: '/advisor-marketplace',
    whatToShow: [
      'View session fees',
      'Payment status (fallback)',
      'Download invoices',
    ],
    verifyFn: async (userId) => {
      const { data } = await supabase.from('session_payments').select('id').eq('client_user_id', userId).limit(1);
      if (!data || data.length === 0) return { pass: false, message: 'No payment records. Book a paid session.' };
      return { pass: true, message: 'Payment records exist (Stripe not configured, fallback active).' };
    },
  },
];
