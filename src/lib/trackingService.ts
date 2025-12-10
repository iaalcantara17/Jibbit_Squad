// Analytics Tracking Service for UC-146
// Tracks user events for analytics dashboard

interface TrackingEvent {
  name: string;
  category: string;
  properties?: Record<string, any>;
}

class TrackingService {
  private enabled: boolean = true;
  private queue: TrackingEvent[] = [];
  private userId: string | null = null;
  private sessionId: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.initFromStorage();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initFromStorage() {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('analytics_consent');
      this.enabled = consent !== 'false';
    }
  }

  setUserId(userId: string | null) {
    this.userId = userId;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('analytics_consent', String(enabled));
    }
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  // Core tracking method
  track(eventName: string, category: string, properties?: Record<string, any>) {
    if (!this.enabled) return;

    const event: TrackingEvent = {
      name: eventName,
      category,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userId: this.userId,
        url: typeof window !== 'undefined' ? window.location.pathname : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      },
    };

    this.queue.push(event);
    this.processQueue();

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[Analytics]', eventName, event.properties);
    }
  }

  // High-level tracking methods
  trackPageView(pageName: string, additionalProps?: Record<string, any>) {
    this.track('page_view', 'navigation', {
      page: pageName,
      ...additionalProps,
    });
  }

  trackRegistration(method: 'email' | 'google' | 'linkedin') {
    this.track('user_registered', 'auth', { method });
  }

  trackLogin(method: 'email' | 'google' | 'linkedin') {
    this.track('user_login', 'auth', { method });
  }

  trackJobCreated(jobId: string, source?: string) {
    this.track('job_created', 'jobs', { jobId, source });
  }

  trackJobApplied(jobId: string, companyName: string) {
    this.track('job_applied', 'jobs', { jobId, companyName });
  }

  trackResumeCreated(resumeId: string, templateUsed?: string) {
    this.track('resume_created', 'resumes', { resumeId, templateUsed });
  }

  trackCoverLetterGenerated(coverLetterId: string, aiGenerated: boolean) {
    this.track('cover_letter_generated', 'cover_letters', { coverLetterId, aiGenerated });
  }

  trackInterviewScheduled(interviewId: string, interviewType: string) {
    this.track('interview_scheduled', 'interviews', { interviewId, interviewType });
  }

  trackAIFeatureUsed(featureName: string, success: boolean, responseTimeMs?: number) {
    this.track('ai_feature_used', 'ai', { featureName, success, responseTimeMs });
  }

  trackOfferReceived(jobId: string, companyName: string) {
    this.track('offer_received', 'offers', { jobId, companyName });
  }

  trackNetworkContactAdded(contactId: string) {
    this.track('contact_added', 'network', { contactId });
  }

  trackDocumentShared(documentType: string, documentId: string) {
    this.track('document_shared', 'collaboration', { documentType, documentId });
  }

  trackFeatureEngagement(featureName: string, action: string) {
    this.track('feature_engagement', 'engagement', { featureName, action });
  }

  trackError(errorType: string, errorMessage: string, component?: string) {
    this.track('error_occurred', 'errors', { errorType, errorMessage, component });
  }

  // Process the event queue - in production, this would send to analytics backend
  private async processQueue() {
    if (this.queue.length === 0) return;

    const events = [...this.queue];
    this.queue = [];

    // Store events in Supabase for analytics dashboard
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      
      for (const event of events) {
        await supabase.from('analytics_events').insert({
          event_name: event.name,
          event_category: event.category,
          event_properties: event.properties,
          user_id: this.userId,
          session_id: this.sessionId,
          page_url: event.properties?.url,
          user_agent: event.properties?.userAgent,
        });
      }
    } catch (error) {
      // Silently fail - don't break the app for analytics
      console.warn('[Analytics] Failed to store events:', error);
      // Re-queue events for retry
      this.queue = [...events, ...this.queue];
    }
  }

  // Get analytics summary for dashboard
  async getAnalyticsSummary(days: number = 30): Promise<any> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_name, event_category, created_at')
        .eq('user_id', this.userId)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Aggregate events by category
      const summary = (data || []).reduce((acc: any, event) => {
        if (!acc[event.event_category]) {
          acc[event.event_category] = {};
        }
        if (!acc[event.event_category][event.event_name]) {
          acc[event.event_category][event.event_name] = 0;
        }
        acc[event.event_category][event.event_name]++;
        return acc;
      }, {});

      return summary;
    } catch (error) {
      console.error('[Analytics] Failed to get summary:', error);
      return {};
    }
  }
}

// Singleton instance
export const trackingService = new TrackingService();
