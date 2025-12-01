// Enhanced Analytics Service for Job Search Tracking
// Pure functions for metric computation - fully testable

export interface JobAnalytics {
  total: number;
  byStatus: Record<string, number>;
  responseRate: number;
  avgTimeInStage: Record<string, number>; // days
  deadlineAdherence: number; // percentage
  timeToOffer: number | null; // days from applied to offer
  upcomingDeadlines: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    deadline: string;
    daysUntil: number;
  }>;
  monthlyApplications: Array<{
    month: string;
    count: number;
  }>;
}

// ========== Core Metrics (Pure Functions) ==========

export const calculateApplicationsSent = (jobs: any[]): number => {
  return jobs.filter(j => 
    ['Applied', 'applied', 'Phone Screen', 'phone_screen', 'Interview', 'interview', 'Offer', 'offer', 'Rejected', 'rejected'].includes(j.status)
  ).length;
};

export const calculateInterviewsScheduled = (interviews: any[]): number => {
  return interviews.filter(i => i.scheduled_start || i.interview_date).length;
};

export const calculateOffersReceived = (jobs: any[], offers?: any[]): number => {
  if (offers) return offers.length;
  return jobs.filter(j => j.status === 'Offer' || j.status === 'offer').length;
};

export const calculateConversionRates = (jobs: any[]): {
  appliedToInterview: number;
  interviewToOffer: number;
  appliedToOffer: number;
} => {
  const applied = calculateApplicationsSent(jobs);
  const interviewed = jobs.filter(j => 
    ['Interview', 'interview', 'Offer', 'offer'].includes(j.status)
  ).length;
  const offers = calculateOffersReceived(jobs);

  return {
    appliedToInterview: applied > 0 ? Math.round((interviewed / applied) * 100) : 0,
    interviewToOffer: interviewed > 0 ? Math.round((offers / interviewed) * 100) : 0,
    appliedToOffer: applied > 0 ? Math.round((offers / applied) * 100) : 0,
  };
};

export const calculateMedianTimeToResponse = (jobs: any[], statusHistory: any[]): number | null => {
  const historyByJob = statusHistory.reduce((acc, h) => {
    if (!acc[h.job_id]) acc[h.job_id] = [];
    acc[h.job_id].push(h);
    return acc;
  }, {} as Record<string, any[]>);

  const responseTimes: number[] = [];

  jobs.forEach(job => {
    const history = historyByJob[job.id];
    if (!history || history.length < 2) return;

    const sorted = history.sort((a, b) => 
      new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );

    const appliedEntry = sorted.find(h => h.to_status === 'Applied' || h.to_status === 'applied');
    const responseEntry = sorted.find(h => 
      ['Phone Screen', 'phone_screen', 'Interview', 'interview', 'Offer', 'offer', 'Rejected', 'rejected'].includes(h.to_status)
    );

    if (appliedEntry && responseEntry) {
      const days = Math.floor(
        (new Date(responseEntry.changed_at).getTime() - new Date(appliedEntry.changed_at).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      if (days > 0) responseTimes.push(days);
    }
  });

  if (responseTimes.length === 0) return null;

  responseTimes.sort((a, b) => a - b);
  const mid = Math.floor(responseTimes.length / 2);
  return responseTimes.length % 2 === 0 
    ? Math.round((responseTimes[mid - 1] + responseTimes[mid]) / 2)
    : responseTimes[mid];
};

// ========== Filter Utilities ==========

export const filterJobsByDateRange = (
  jobs: any[], 
  startDate: Date | null, 
  endDate: Date | null
): any[] => {
  if (!startDate && !endDate) return jobs;

  return jobs.filter(job => {
    const jobDate = new Date(job.created_at);
    if (startDate && jobDate < startDate) return false;
    if (endDate && jobDate > endDate) return false;
    return true;
  });
};

export const filterJobsByCompany = (jobs: any[], company: string | null): any[] => {
  if (!company) return jobs;
  return jobs.filter(j => j.company_name?.toLowerCase().includes(company.toLowerCase()));
};

export const filterJobsByRole = (jobs: any[], role: string | null): any[] => {
  if (!role) return jobs;
  return jobs.filter(j => j.job_title?.toLowerCase().includes(role.toLowerCase()));
};

export const filterJobsByIndustry = (jobs: any[], industry: string | null): any[] => {
  if (!industry) return jobs;
  return jobs.filter(j => j.industry?.toLowerCase().includes(industry.toLowerCase()));
};

export const getUniqueCompanies = (jobs: any[]): string[] => {
  return [...new Set(jobs.map(j => j.company_name).filter(Boolean))].sort();
};

export const getUniqueRoles = (jobs: any[]): string[] => {
  return [...new Set(jobs.map(j => j.job_title).filter(Boolean))].sort();
};

export const getUniqueIndustries = (jobs: any[]): string[] => {
  return [...new Set(jobs.map(j => j.industry).filter(Boolean))].sort();
};

export const calculateAverageTimeInStage = (jobs: any[], statusHistory: any[]): Record<string, number> => {
  const stageTime: Record<string, number[]> = {};
  
  // Group history by job_id
  const historyByJob = statusHistory.reduce((acc, h) => {
    if (!acc[h.job_id]) acc[h.job_id] = [];
    acc[h.job_id].push(h);
    return acc;
  }, {} as Record<string, any[]>);
  
  jobs.forEach(job => {
    const history = historyByJob[job.id];
    if (!history || history.length < 2) return;
    
    // Sort by changed_at
    const sorted = history.sort((a, b) => 
      new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime()
    );
    
    for (let i = 1; i < sorted.length; i++) {
      const current = sorted[i];
      const previous = sorted[i - 1];
      
      const timeInStage = Math.floor(
        (new Date(current.changed_at).getTime() - new Date(previous.changed_at).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      if (!stageTime[previous.to_status]) {
        stageTime[previous.to_status] = [];
      }
      stageTime[previous.to_status].push(timeInStage);
    }
  });
  
  const avgTime: Record<string, number> = {};
  Object.keys(stageTime).forEach(stage => {
    const times = stageTime[stage];
    avgTime[stage] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  });
  
  return avgTime;
};

export const calculateDeadlineAdherence = (jobs: any[], statusHistory: any[]): number => {
  const jobsWithDeadlines = jobs.filter(j => j.application_deadline);
  if (jobsWithDeadlines.length === 0) return 100;
  
  // Group history by job_id
  const historyByJob = statusHistory.reduce((acc, h) => {
    if (!acc[h.job_id]) acc[h.job_id] = [];
    acc[h.job_id].push(h);
    return acc;
  }, {} as Record<string, any[]>);
  
  const metDeadlines = jobsWithDeadlines.filter(job => {
    const history = historyByJob[job.id];
    if (!history) return false;
    
    const appliedEntry = history.find((h: any) => h.to_status === 'Applied');
    if (!appliedEntry) return false;
    
    const appliedDate = new Date(appliedEntry.changed_at);
    const deadline = new Date(job.application_deadline);
    
    return appliedDate <= deadline;
  });
  
  return Math.round((metDeadlines.length / jobsWithDeadlines.length) * 100);
};

export const calculateTimeToOffer = (jobs: any[], statusHistory: any[]): number | null => {
  const offeredJobs = jobs.filter(j => j.status === 'Offer');
  
  if (offeredJobs.length === 0) return null;
  
  // Group history by job_id
  const historyByJob = statusHistory.reduce((acc, h) => {
    if (!acc[h.job_id]) acc[h.job_id] = [];
    acc[h.job_id].push(h);
    return acc;
  }, {} as Record<string, any[]>);
  
  const times = offeredJobs.map(job => {
    const history = historyByJob[job.id];
    if (!history) return null;
    
    const appliedEntry = history.find((h: any) => h.to_status === 'Applied');
    const offerEntry = history.find((h: any) => h.to_status === 'Offer');
    
    if (!appliedEntry || !offerEntry) return null;
    
    const appliedDate = new Date(appliedEntry.changed_at);
    const offerDate = new Date(offerEntry.changed_at);
    
    return Math.floor((offerDate.getTime() - appliedDate.getTime()) / (1000 * 60 * 60 * 24));
  }).filter(t => t !== null) as number[];
  
  if (times.length === 0) return null;
  
  return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
};

export const getUpcomingDeadlines = (jobs: any[], days: number = 30): Array<any> => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  
  return jobs
    .filter(job => {
      if (!job.application_deadline || job.is_archived) return false;
      const deadline = new Date(job.application_deadline);
      return deadline >= now && deadline <= futureDate;
    })
    .map(job => {
      const deadline = new Date(job.application_deadline);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        jobId: job.id,
        jobTitle: job.job_title || job.title,
        company: job.company_name || 'Unknown',
        deadline: job.application_deadline,
        daysUntil
      };
    })
    .sort((a, b) => a.daysUntil - b.daysUntil);
};

export const getMonthlyApplications = (jobs: any[], months: number = 6): Array<any> => {
  const now = new Date();
  const monthsData: Record<string, number> = {};
  
  // Initialize last N months
  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    monthsData[key] = 0;
  }
  
  // Count jobs by created_at month
  jobs.forEach(job => {
    const createdDate = new Date(job.created_at);
    const key = createdDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (monthsData.hasOwnProperty(key)) {
      monthsData[key]++;
    }
  });
  
  return Object.entries(monthsData).map(([month, count]) => ({ month, count }));
};
