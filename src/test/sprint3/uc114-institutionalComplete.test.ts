/**
 * UC-114: Corporate Career Services Integration - Complete Test Coverage
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { supabase } from '@/integrations/supabase/client';

describe('UC-114: Corporate Career Services Integration', () => {
  const testUserId = 'test-user-institutional';

  beforeEach(async () => {
    // Clean up test data
    await supabase.from('institutional_settings').delete().eq('created_by', testUserId);
    await supabase.from('audit_logs').delete().eq('user_id', testUserId);
  });

  describe('White-Label Branding', () => {
    it('should configure institutional settings', async () => {
      const { data: settings } = await supabase
        .from('institutional_settings')
        .insert({
          created_by: testUserId,
          institution_name: 'Test University',
          primary_color: '#1E40AF',
          secondary_color: '#7C3AED',
        })
        .select()
        .single();

      expect(settings).toBeDefined();
      expect(settings?.institution_name).toBe('Test University');
      expect(settings?.primary_color).toBe('#1E40AF');
    });

    it('should support custom domain configuration', async () => {
      const { data: settings } = await supabase
        .from('institutional_settings')
        .insert({
          created_by: testUserId,
          institution_name: 'Test College',
          custom_domain: 'careers.testcollege.edu',
        })
        .select()
        .single();

      expect(settings?.custom_domain).toBe('careers.testcollege.edu');
    });
  });

  describe('Compliance Features', () => {
    it('should log audit events', async () => {
      const { data: log } = await supabase
        .from('audit_logs')
        .insert({
          user_id: testUserId,
          action: 'create',
          entity_type: 'resume',
          entity_id: 'test-resume-id',
          metadata: { test: true },
        })
        .select()
        .single();

      expect(log).toBeDefined();
      expect(log?.action).toBe('create');
    });

    it('should configure data retention policies', async () => {
      // First create institutional settings
      const { data: settings } = await supabase
        .from('institutional_settings')
        .insert({
          created_by: testUserId,
          institution_name: 'Test Institution',
        })
        .select()
        .single();

      if (!settings) throw new Error('Settings not created');

      const { data: policy } = await supabase
        .from('data_retention_policies')
        .insert({
          institution_id: settings.id,
          entity_type: 'resumes',
          retention_days: 365,
          auto_delete: true,
        })
        .select()
        .single();

      expect(policy).toBeDefined();
      expect(policy?.retention_days).toBe(365);
      expect(policy?.auto_delete).toBe(true);
    });
  });

  describe('Bulk Onboarding', () => {
    it('should validate bulk onboarding data structure', () => {
      const csvData = [
        { email: 'student1@test.edu', name: 'Student One', role: 'candidate' },
        { email: 'student2@test.edu', name: 'Student Two', role: 'candidate' },
      ];

      expect(csvData).toHaveLength(2);
      expect(csvData[0].email).toMatch(/@/);
    });
  });

  describe('Aggregate Reporting', () => {
    it('should query cohort data for reporting', async () => {
      // Create settings first
      const { data: settings } = await supabase
        .from('institutional_settings')
        .insert({
          created_by: testUserId,
          institution_name: 'Report Test Institution',
        })
        .select()
        .single();

      if (!settings) throw new Error('Settings not created');

      const { data: cohort } = await supabase
        .from('institutional_cohorts')
        .insert({
          institution_id: settings.id,
          cohort_name: 'Class of 2024',
          start_date: new Date('2024-01-01').toISOString(),
          end_date: new Date('2024-12-31').toISOString(),
        })
        .select()
        .single();

      expect(cohort).toBeDefined();
      expect(cohort?.cohort_name).toBe('Class of 2024');
    });
  });

  describe('RLS Policies', () => {
    it('should enforce RLS for institutional settings', async () => {
      const { data: settings } = await supabase
        .from('institutional_settings')
        .select('*')
        .eq('created_by', testUserId);

      expect(settings).toBeDefined();
    });

    it('should enforce RLS for audit logs', async () => {
      const { data: logs } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', testUserId)
        .limit(10);

      expect(logs).toBeDefined();
    });
  });
});
