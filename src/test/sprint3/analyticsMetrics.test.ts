import { describe, it, expect } from 'vitest';

describe('Analytics Metric Calculations', () => {
  describe('Interview Success Metrics', () => {
    it('should calculate interview conversion rate', () => {
      const totalInterviews = 10;
      const offersReceived = 3;
      const conversionRate = (offersReceived / totalInterviews) * 100;

      expect(conversionRate).toBe(30);
    });

    it('should calculate average interviews per offer', () => {
      const totalInterviews = 15;
      const totalOffers = 3;
      const avgInterviewsPerOffer = totalInterviews / totalOffers;

      expect(avgInterviewsPerOffer).toBe(5);
    });

    it('should calculate pass-through rates by stage', () => {
      const stageData = [
        { stage: 'phone-screen', total: 20, passed: 15 },
        { stage: 'technical', total: 15, passed: 10 },
        { stage: 'onsite', total: 10, passed: 5 },
      ];

      const rates = stageData.map(s => ({
        stage: s.stage,
        rate: (s.passed / s.total) * 100,
      }));

      expect(rates[0].rate).toBe(75); // phone-screen
      expect(rates[1].rate).toBeCloseTo(66.67, 1); // technical
      expect(rates[2].rate).toBe(50); // onsite
    });
  });

  describe('Application Metrics', () => {
    it('should calculate application to interview ratio', () => {
      const totalApplications = 50;
      const interviewsReceived = 10;
      const ratio = (interviewsReceived / totalApplications) * 100;

      expect(ratio).toBe(20);
    });

    it('should calculate average days to first interview', () => {
      const applications = [
        { appliedDate: '2024-12-01', firstInterviewDate: '2024-12-10' },
        { appliedDate: '2024-12-05', firstInterviewDate: '2024-12-12' },
        { appliedDate: '2024-12-08', firstInterviewDate: '2024-12-20' },
      ];

      const daysDiffs = applications.map(a => {
        const applied = new Date(a.appliedDate);
        const interview = new Date(a.firstInterviewDate);
        return Math.floor((interview.getTime() - applied.getTime()) / (1000 * 60 * 60 * 24));
      });

      const avgDays = daysDiffs.reduce((sum, d) => sum + d, 0) / daysDiffs.length;

      expect(avgDays).toBeCloseTo(9.67, 1);
    });
  });

  describe('Goal Progress Metrics', () => {
    it('should calculate goal completion percentage', () => {
      const goal = {
        current_value: 15,
        target_value: 20,
      };

      const percentage = (goal.current_value / goal.target_value) * 100;

      expect(percentage).toBe(75);
    });

    it('should calculate days remaining to deadline', () => {
      const targetDate = new Date('2024-12-31');
      const today = new Date('2024-12-01');
      const daysRemaining = Math.floor(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      expect(daysRemaining).toBe(30);
    });

    it('should determine if goal is on track', () => {
      const goal = {
        current_value: 15,
        target_value: 20,
        start_date: '2024-11-01',
        target_date: '2024-12-31',
      };

      const today = new Date('2024-12-01');
      const start = new Date(goal.start_date);
      const end = new Date(goal.target_date);

      const totalDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      const elapsedDays = (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      const expectedProgress = (elapsedDays / totalDays) * goal.target_value;
      const isOnTrack = goal.current_value >= expectedProgress;

      expect(isOnTrack).toBe(true);
    });
  });

  describe('Networking Metrics', () => {
    it('should calculate response rate for outreach', () => {
      const totalOutreach = 30;
      const responsesReceived = 12;
      const responseRate = (responsesReceived / totalOutreach) * 100;

      expect(responseRate).toBe(40);
    });

    it('should calculate networking ROI', () => {
      const eventData = {
        eventsAttended: 5,
        contactsMade: 25,
        referralsReceived: 3,
        interviewsFromReferrals: 2,
      };

      const contactsPerEvent = eventData.contactsMade / eventData.eventsAttended;
      const referralConversionRate = (eventData.referralsReceived / eventData.contactsMade) * 100;

      expect(contactsPerEvent).toBe(5);
      expect(referralConversionRate).toBe(12);
    });
  });

  describe('Time Investment Metrics', () => {
    it('should calculate time spent by activity', () => {
      const activities = [
        { type: 'applications', hours: 10 },
        { type: 'interview_prep', hours: 15 },
        { type: 'networking', hours: 8 },
      ];

      const totalHours = activities.reduce((sum, a) => sum + a.hours, 0);
      const percentages = activities.map(a => ({
        type: a.type,
        percentage: (a.hours / totalHours) * 100,
      }));

      expect(totalHours).toBe(33);
      expect(percentages[1].percentage).toBeCloseTo(45.45, 1);
    });
  });

  describe('Salary Progression', () => {
    it('should calculate salary growth percentage', () => {
      const currentSalary = 80000;
      const previousSalary = 70000;
      const growth = ((currentSalary - previousSalary) / previousSalary) * 100;

      expect(growth).toBeCloseTo(14.29, 1);
    });

    it('should calculate compound annual growth rate (CAGR)', () => {
      const initialSalary = 60000;
      const finalSalary = 80000;
      const years = 3;

      const cagr = (Math.pow(finalSalary / initialSalary, 1 / years) - 1) * 100;

      expect(cagr).toBeGreaterThan(0);
      expect(cagr).toBeLessThan(50);
    });
  });
});
