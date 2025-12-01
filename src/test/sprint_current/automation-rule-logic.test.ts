import { describe, it, expect } from 'vitest';

describe('Automation Rule Logic', () => {
  describe('Rule validation', () => {
    it('validates required rule fields', () => {
      const rule = {
        name: 'Deadline Reminder',
        trigger: { type: 'deadline', days_before: 3 },
        action: { type: 'send_email', subject: 'Reminder', body: 'Deadline approaching' },
        is_enabled: true,
      };

      const isValid = !!(
        rule.name &&
        rule.trigger?.type &&
        rule.action?.type &&
        typeof rule.is_enabled === 'boolean'
      );

      expect(isValid).toBe(true);
    });

    it('rejects incomplete rules', () => {
      const incompleteRule = {
        name: 'Test Rule',
        trigger: { type: 'deadline' },
        // Missing action
      };

      const isValid = !!(
        incompleteRule.name &&
        incompleteRule.trigger?.type &&
        (incompleteRule as any).action?.type
      );

      expect(isValid).toBe(false);
    });
  });

  describe('Trigger evaluation', () => {
    it('checks if deadline trigger should fire', () => {
      const rule = {
        trigger: { type: 'deadline', days_before: 3 },
      };

      const job = {
        deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      };

      const daysUntilDeadline = Math.ceil(
        (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const shouldFire = daysUntilDeadline <= rule.trigger.days_before;

      expect(shouldFire).toBe(true);
    });

    it('does not fire when deadline is far away', () => {
      const rule = {
        trigger: { type: 'deadline', days_before: 3 },
      };

      const job = {
        deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
      };

      const daysUntilDeadline = Math.ceil(
        (new Date(job.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );

      const shouldFire = daysUntilDeadline <= rule.trigger.days_before;

      expect(shouldFire).toBe(false);
    });
  });

  describe('Status change triggers', () => {
    it('detects status change from applied to interview', () => {
      const oldStatus = 'Applied';
      const newStatus = 'Interview';

      const trigger = { type: 'status_change', from: 'Applied', to: 'Interview' };
      
      const matches = oldStatus === trigger.from && newStatus === trigger.to;

      expect(matches).toBe(true);
    });

    it('ignores non-matching status changes', () => {
      const oldStatus = 'Applied';
      const newStatus = 'Rejected';

      const trigger = { type: 'status_change', from: 'Applied', to: 'Interview' };
      
      const matches = oldStatus === trigger.from && newStatus === trigger.to;

      expect(matches).toBe(false);
    });
  });

  describe('Action preparation', () => {
    it('prepares email action with interpolated variables', () => {
      const action = {
        type: 'send_email',
        subject: 'Reminder: {{job_title}}',
        body: 'Your application to {{company}} has a deadline in {{days}} days',
      };

      const context = {
        job_title: 'Software Engineer',
        company: 'TechCorp',
        days: 3,
      };

      const preparedSubject = action.subject.replace(/\{\{(\w+)\}\}/g, (_, key) => 
        String(context[key as keyof typeof context])
      );

      const preparedBody = action.body.replace(/\{\{(\w+)\}\}/g, (_, key) => 
        String(context[key as keyof typeof context])
      );

      expect(preparedSubject).toBe('Reminder: Software Engineer');
      expect(preparedBody).toBe('Your application to TechCorp has a deadline in 3 days');
    });
  });
});
