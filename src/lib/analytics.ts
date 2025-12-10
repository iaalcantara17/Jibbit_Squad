// UC-146: Google Analytics 4 Integration
// This module handles GA4 initialization and event tracking

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let initialized = false;

export function initGA4() {
  if (initialized || !GA_MEASUREMENT_ID) {
    if (!GA_MEASUREMENT_ID) {
      console.warn('[Analytics] GA4 not configured - VITE_GA4_MEASUREMENT_ID not set');
    }
    return;
  }

  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };
  
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll send manually for SPA
  });

  initialized = true;
  console.log('[Analytics] GA4 initialized');
}

export function trackPageView(path: string, title?: string) {
  if (!initialized || !window.gtag) return;
  
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (!initialized || !window.gtag) return;
  
  window.gtag('event', eventName, params);
}

// Pre-defined events for the application
export const analyticsEvents = {
  // Auth events
  registration_completed: (method: string) => 
    trackEvent('sign_up', { method }),
  
  login: (method: string) => 
    trackEvent('login', { method }),
  
  // Job tracking events
  job_application_created: (jobId: string, company: string) => 
    trackEvent('job_application_created', { job_id: jobId, company }),
  
  job_status_updated: (jobId: string, newStatus: string) => 
    trackEvent('job_status_updated', { job_id: jobId, status: newStatus }),
  
  // AI feature events
  ai_quality_score_run: (jobId: string, score: number) => 
    trackEvent('ai_quality_score', { job_id: jobId, score }),
  
  ai_resume_generated: (resumeId: string) => 
    trackEvent('ai_resume_generated', { resume_id: resumeId }),
  
  ai_cover_letter_generated: (coverLetterId: string) => 
    trackEvent('ai_cover_letter_generated', { cover_letter_id: coverLetterId }),
  
  // Offer events
  offer_comparison_viewed: (offerCount: number) => 
    trackEvent('offer_comparison_viewed', { offer_count: offerCount }),
  
  offer_received: (companyName: string) => 
    trackEvent('offer_received', { company: companyName }),
  
  // Feature engagement
  feature_used: (featureName: string) => 
    trackEvent('feature_engagement', { feature: featureName }),
  
  // Funnel events
  funnel_step: (funnelName: string, step: number, stepName: string) => 
    trackEvent('funnel_step', { funnel: funnelName, step, step_name: stepName }),
};

// Simple funnel tracking
export const funnels = {
  registration_to_first_application: {
    name: 'registration_to_first_application',
    steps: [
      { step: 1, name: 'registration' },
      { step: 2, name: 'profile_completed' },
      { step: 3, name: 'first_job_added' },
      { step: 4, name: 'first_application' },
    ],
  },
  job_to_offer: {
    name: 'job_to_offer',
    steps: [
      { step: 1, name: 'job_saved' },
      { step: 2, name: 'application_submitted' },
      { step: 3, name: 'interview_scheduled' },
      { step: 4, name: 'offer_received' },
    ],
  },
};

export function trackFunnelStep(funnelName: string, stepNumber: number) {
  const funnel = Object.values(funnels).find(f => f.name === funnelName);
  if (!funnel) return;
  
  const step = funnel.steps.find(s => s.step === stepNumber);
  if (!step) return;
  
  analyticsEvents.funnel_step(funnelName, step.step, step.name);
}
