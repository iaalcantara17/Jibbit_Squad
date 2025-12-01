/**
 * Sprint 3 Additional Seeding (UC-112, UC-114, UC-115)
 */

import { supabase } from '@/integrations/supabase/client';

export interface Sprint3SeedResult {
  supportGroups: number;
  groupMembers: number;
  groupPosts: number;
  groupChallenges: number;
  groupWebinars: number;
  peerReferrals: number;
  institutionalSettings: number;
  cohorts: number;
  cohortMembers: number;
  advisorProfiles: number;
  coachingSessions: number;
  sessionPayments: number;
}

export async function seedSprint3Data(userId: string): Promise<Sprint3SeedResult> {
  const result: Sprint3SeedResult = {
    supportGroups: 0,
    groupMembers: 0,
    groupPosts: 0,
    groupChallenges: 0,
    groupWebinars: 0,
    peerReferrals: 0,
    institutionalSettings: 0,
    cohorts: 0,
    cohortMembers: 0,
    advisorProfiles: 0,
    coachingSessions: 0,
    sessionPayments: 0,
  };

  // Seed support groups (UC-112)
  const groupsData = [
    {
      name: 'Software Engineers - Bay Area',
      description: 'Connect with fellow software engineers in the San Francisco Bay Area',
      group_type: 'industry',
      industry: 'Technology',
      location: 'San Francisco Bay Area',
      is_private: false,
      created_by: userId,
    },
    {
      name: 'Career Changers - Product Management',
      description: 'Support group for professionals transitioning into product management',
      group_type: 'role',
      role: 'Product Manager',
      is_private: false,
      created_by: userId,
    },
    {
      name: 'Tech Industry Newcomers',
      description: 'General support for those entering the tech industry',
      group_type: 'general',
      is_private: false,
      created_by: userId,
    },
  ];

  const { data: groups } = await supabase
    .from('support_groups')
    .upsert(groupsData, { onConflict: 'created_by,name', ignoreDuplicates: false })
    .select();

  if (groups) {
    result.supportGroups = groups.length;

    // Auto-join creator
    await supabase.from('support_group_members').upsert(
      groups.map(g => ({
        group_id: g.id,
        user_id: userId,
        privacy_level: 'full_profile',
      })),
      { onConflict: 'group_id,user_id' }
    );
    result.groupMembers = groups.length;

    // Seed group posts
    if (groups[0]) {
      await supabase.from('group_posts').upsert([
        {
          group_id: groups[0].id,
          user_id: userId,
          post_type: 'discussion',
          title: 'Tips for technical interviews',
          content: 'What strategies have worked for you in coding interviews?',
          is_anonymous: false,
        },
        {
          group_id: groups[0].id,
          user_id: userId,
          post_type: 'success',
          title: 'Just got an offer!',
          content: 'After 3 months of searching, I finally got an offer. Happy to share my experience.',
          is_anonymous: true,
        },
      ], { onConflict: 'group_id,title' });
      result.groupPosts = 2;

      // Seed group challenge
      await supabase.from('group_challenges').upsert({
        group_id: groups[0].id,
        created_by: userId,
        title: '30-Day Application Challenge',
        description: 'Apply to 10 jobs in 30 days',
        challenge_type: 'applications',
        target_value: 10,
        duration_days: 30,
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'group_id,title' });
      result.groupChallenges = 1;

      // Seed group webinar
      await supabase.from('group_webinars').upsert({
        group_id: groups[0].id,
        title: 'System Design Interview Workshop',
        description: 'Learn best practices for system design interviews',
        host_name: 'Senior Staff Engineer',
        scheduled_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 90,
        meeting_link: 'https://zoom.us/j/demo456',
      }, { onConflict: 'group_id,title' });
      result.groupWebinars = 1;

      // Seed peer referral (no table exists in schema, skip)
      // result.peerReferrals = 1;
    }
  }

  // Seed institutional settings (UC-114)
  await supabase.from('institutional_settings').upsert({
    created_by: userId,
    institution_name: 'University Career Services',
    logo_url: null,
    primary_color: '#1E40AF',
    secondary_color: '#7C3AED',
    custom_domain: null,
  }, { onConflict: 'created_by' });
  result.institutionalSettings = 1;

  // Seed advisor profile (UC-115)
  await supabase.from('advisor_profiles').upsert({
    user_id: userId,
    display_name: 'Career Coach Demo',
    bio: 'Experienced career coach specializing in tech industry transitions',
    specialization: ['Career Coaching', 'Interview Prep', 'Salary Negotiation'],
    hourly_rate: 150,
    is_active: true,
  }, { onConflict: 'user_id' });
  result.advisorProfiles = 1;

  // Seed family supporters + messages (UC-113)
  const { data: supporters } = await supabase.from('family_supporters').upsert([
    {
      user_id: userId,
      supporter_name: 'Sarah (Spouse)',
      supporter_email: 'sarah.demo@example.com',
      relationship: 'spouse',
      access_level: 'full',
      invite_token: 'demo-token-spouse-' + Date.now(),
      can_send_messages: true,
      accepted_at: new Date().toISOString(),
    },
    {
      user_id: userId,
      supporter_name: 'Mom',
      supporter_email: 'mom.demo@example.com',
      relationship: 'parent',
      access_level: 'view_only',
      invite_token: 'demo-token-parent-' + Date.now(),
      can_send_messages: true,
      accepted_at: new Date().toISOString(),
    },
  ], { onConflict: 'user_id,supporter_email', ignoreDuplicates: false }).select();

  if (supporters && supporters.length > 0) {
    // Seed supporter messages
    await supabase.from('supporter_messages').upsert([
      {
        supporter_id: supporters[0].id,
        user_id: userId,
        message_text: 'So proud of you! Keep up the great work on your job search! 💪',
        sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        supporter_id: supporters[1].id,
        user_id: userId,
        message_text: 'Thinking of you today. You got this! ❤️',
        sent_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ], { onConflict: 'supporter_id,sent_at', ignoreDuplicates: false });

    // Seed user updates for supporters to view
    await supabase.from('user_updates').upsert([
      {
        user_id: userId,
        update_type: 'milestone',
        update_text: 'Completed 5 interviews! Hit a major milestone in my job search journey',
        visibility: 'supporters',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ], { onConflict: 'user_id,update_text', ignoreDuplicates: false });
  }

  return result;
}
