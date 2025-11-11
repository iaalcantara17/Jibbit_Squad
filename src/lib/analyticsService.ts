// Enhanced Analytics Service for Job Search Tracking

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

export const calculateAverageTimeInStage = (jobs: any[]): Record<string, number> => {
  const stageTime: Record<string, number[]> = {};
  
  jobs.forEach(job => {
    if (!job.statusHistory || job.statusHistory.length < 2) return;
    
    for (let i = 1; i < job.statusHistory.length; i++) {
      const current = job.statusHistory[i];
      const previous = job.statusHistory[i - 1];
      
      const timeInStage = Math.floor(
        (new Date(current.changedAt).getTime() - new Date(previous.changedAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      
      if (!stageTime[previous.status]) {
        stageTime[previous.status] = [];
      }
      stageTime[previous.status].push(timeInStage);
    }
  });
  
  const avgTime: Record<string, number> = {};
  Object.keys(stageTime).forEach(stage => {
    const times = stageTime[stage];
    avgTime[stage] = Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  });
  
  return avgTime;
};

export const calculateDeadlineAdherence = (jobs: any[]): number => {
  const jobsWithDeadlines = jobs.filter(j => j.applicationDeadline);
  if (jobsWithDeadlines.length === 0) return 100;
  
  const metDeadlines = jobsWithDeadlines.filter(job => {
    if (!job.statusHistory || job.statusHistory.length === 0) return false;
    
    const appliedEntry = job.statusHistory.find((h: any) => h.status === 'Applied');
    if (!appliedEntry) return false;
    
    const appliedDate = new Date(appliedEntry.changedAt);
    const deadline = new Date(job.applicationDeadline);
    
    return appliedDate <= deadline;
  });
  
  return Math.round((metDeadlines.length / jobsWithDeadlines.length) * 100);
};

export const calculateTimeToOffer = (jobs: any[]): number | null => {
  const offeredJobs = jobs.filter(j => j.status === 'Offer' && j.statusHistory);
  
  if (offeredJobs.length === 0) return null;
  
  const times = offeredJobs.map(job => {
    const appliedEntry = job.statusHistory.find((h: any) => h.status === 'Applied');
    const offerEntry = job.statusHistory.find((h: any) => h.status === 'Offer');
    
    if (!appliedEntry || !offerEntry) return null;
    
    const appliedDate = new Date(appliedEntry.changedAt);
    const offerDate = new Date(offerEntry.changedAt);
    
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
      if (!job.applicationDeadline || job.isArchived) return false;
      const deadline = new Date(job.applicationDeadline);
      return deadline >= now && deadline <= futureDate;
    })
    .map(job => {
      const deadline = new Date(job.applicationDeadline);
      const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      return {
        jobId: job.id,
        jobTitle: job.jobTitle || job.title,
        company: typeof job.company === 'string' ? job.company : job.company?.name || 'Unknown',
        deadline: job.applicationDeadline,
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
  
  // Count applications per month
  jobs.forEach(job => {
    const appliedEntry = job.statusHistory?.find((h: any) => h.status === 'Applied');
    if (!appliedEntry) return;
    
    const appliedDate = new Date(appliedEntry.changedAt);
    const key = appliedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (monthsData.hasOwnProperty(key)) {
      monthsData[key]++;
    }
  });
  
  return Object.entries(monthsData).map(([month, count]) => ({ month, count }));
};