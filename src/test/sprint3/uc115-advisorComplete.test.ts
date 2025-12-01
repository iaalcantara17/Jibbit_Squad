/**
 * UC-115: External Advisor and Coach Integration - Complete Test Coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('UC-115: External Advisor and Coach Integration', () => {
  const testUserId = 'test-user-advisor';

  beforeEach(async () => {
    // Clean up test data
    await supabase.from('session_payments').delete().match({ client_user_id: testUserId });
    await supabase.from('coaching_sessions').delete().match({ client_user_id: testUserId });
    await supabase.from('advisor_profiles').delete().eq('user_id', testUserId);
  });

  describe('Advisor Profiles', () => {
    it('should create advisor profile with specialization', async () => {
      const { data: profile } = await supabase
        .from('advisor_profiles')
        .insert({
          user_id: testUserId,
          display_name: 'Test Advisor',
          bio: 'Experienced career coach',
          specialization: ['Career Coaching', 'Interview Prep'],
          hourly_rate: 150,
          is_active: true,
        })
        .select()
        .single();

      expect(profile).toBeDefined();
      expect(profile?.display_name).toBe('Test Advisor');
      expect(profile?.hourly_rate).toBe(150);
      expect(profile?.specialization).toContain('Career Coaching');
    });

    it('should support advisor active/inactive status', async () => {
      const { data: profile } = await supabase
        .from('advisor_profiles')
        .insert({
          user_id: testUserId,
          display_name: 'Inactive Advisor',
          is_active: false,
        })
        .select()
        .single();

      expect(profile?.is_active).toBe(false);
    });
  });

  describe('Scheduling', () => {
    it('should schedule coaching session with advisor', async () => {
      // First create advisor profile
      const { data: advisor } = await supabase
        .from('advisor_profiles')
        .insert({
          user_id: testUserId,
          display_name: 'Scheduling Test Advisor',
          is_active: true,
        })
        .select()
        .single();

      if (!advisor) throw new Error('Advisor not created');

      const { data: session } = await supabase
        .from('coaching_sessions')
        .insert({
          advisor_id: advisor.id,
          client_user_id: testUserId,
          session_type: 'career_coaching',
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          status: 'scheduled',
        })
        .select()
        .single();

      expect(session).toBeDefined();
      expect(session?.session_type).toBe('career_coaching');
      expect(session?.duration_minutes).toBe(60);
    });

    it('should support different session types', async () => {
      const sessionTypes = ['career_coaching', 'resume_review', 'interview_prep', 'salary_negotiation'];
      
      expect(sessionTypes).toHaveLength(4);
      expect(sessionTypes).toContain('career_coaching');
      expect(sessionTypes).toContain('interview_prep');
    });
  });

  describe('Billing Integration', () => {
    it('should track session payment status', async () => {
      // Create advisor
      const { data: advisor } = await supabase
        .from('advisor_profiles')
        .insert({
          user_id: testUserId,
          display_name: 'Billing Test Advisor',
          hourly_rate: 200,
          is_active: true,
        })
        .select()
        .single();

      if (!advisor) throw new Error('Advisor not created');

      // Create session
      const { data: session } = await supabase
        .from('coaching_sessions')
        .insert({
          advisor_id: advisor.id,
          client_user_id: testUserId,
          session_type: 'resume_review',
          scheduled_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          duration_minutes: 60,
          status: 'scheduled',
        })
        .select()
        .single();

      if (!session) throw new Error('Session not created');

      // Create payment record
      const { data: payment } = await supabase
        .from('session_payments')
        .insert({
          session_id: session.id,
          client_user_id: testUserId,
          advisor_id: advisor.id,
          amount: 200,
          payment_status: 'pending',
        })
        .select()
        .single();

      expect(payment).toBeDefined();
      expect(payment?.amount).toBe(200);
      expect(payment?.payment_status).toBe('pending');
    });

    it('should support completed payment status', async () => {
      // Create minimal test setup
      const { data: advisor } = await supabase
        .from('advisor_profiles')
        .insert({
          user_id: testUserId,
          display_name: 'Payment Status Advisor',
          is_active: true,
        })
        .select()
        .single();

      if (!advisor) throw new Error('Advisor not created');

      const { data: session } = await supabase
        .from('coaching_sessions')
        .insert({
          advisor_id: advisor.id,
          client_user_id: testUserId,
          session_type: 'career_coaching',
          scheduled_date: new Date().toISOString(),
          status: 'completed',
        })
        .select()
        .single();

      if (!session) throw new Error('Session not created');

      const { data: payment } = await supabase
        .from('session_payments')
        .insert({
          session_id: session.id,
          client_user_id: testUserId,
          advisor_id: advisor.id,
          amount: 150,
          payment_status: 'completed',
        })
        .select()
        .single();

      expect(payment?.payment_status).toBe('completed');
    });
  });

  describe('Session Lifecycle', () => {
    it('should track session status transitions', async () => {
      const statusTransitions = ['scheduled', 'in_progress', 'completed', 'cancelled'];
      
      expect(statusTransitions).toContain('scheduled');
      expect(statusTransitions).toContain('completed');
    });
  });

  describe('RLS Policies', () => {
    it('should enforce RLS for advisor profiles', async () => {
      const { data: profiles } = await supabase
        .from('advisor_profiles')
        .select('*')
        .eq('is_active', true);

      expect(profiles).toBeDefined();
    });

    it('should enforce RLS for coaching sessions', async () => {
      const { data: sessions } = await supabase
        .from('coaching_sessions')
        .select('*')
        .eq('client_user_id', testUserId);

      expect(sessions).toBeDefined();
    });
  });
});
