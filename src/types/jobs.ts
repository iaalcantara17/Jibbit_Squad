export type JobStatus = 
  | "interested" 
  | "applied" 
  | "phone_screen" 
  | "interview" 
  | "offer" 
  | "rejected";

export type JobType = 
  | "Full-time" 
  | "Part-time" 
  | "Contract" 
  | "Internship" 
  | "Freelance";

export type DeadlineUrgency = "overdue" | "urgent" | "soon" | "normal" | null;

export interface CompanyInfo {
  name: string;
  size?: string;
  industry?: string;
  location?: string;
  website?: string;
  description?: string;
  logoUrl?: string;
  glassdoorRating?: number;
  recentNews?: Array<{
    title: string;
    url: string;
    date: string;
    source: string;
    category?: string;
    summary?: string;
  }>;
}

export interface JobContact {
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  notes?: string;
}

export interface StatusHistoryEntry {
  status: JobStatus;
  changedAt: string;
  notes?: string;
}

export interface ApplicationMaterials {
  resumeId?: string;
  resumeName?: string;
  coverLetterId?: string;
  coverLetterName?: string;
  appliedDate?: string;
}

export interface Job {
  id: string;
  job_id: string;
  user_id: string;
  jobTitle: string;
  company: CompanyInfo;
  location?: string;
  jobType?: JobType;
  salaryMin?: number;
  salaryMax?: number;
  salary_min?: number;
  salary_max?: number;
  salaryCurrency?: string;
  jobDescription?: string;
  jobUrl?: string;
  status: JobStatus;
  statusHistory?: StatusHistoryEntry[];
  applicationDeadline?: string;
  application_deadline?: string;
  appliedDate?: string;
  applicationMaterials?: ApplicationMaterials;
  notes?: string;
  interviewNotes?: string;
  salaryNegotiationNotes?: string;
  contacts?: JobContact[];
  isArchived: boolean;
  is_archived?: boolean;
  archiveReason?: string;
  archivedAt?: string;
  importedFrom?: string;
  createdAt: string;
  created_at?: string;
  updatedAt: string;
  updated_at?: string;
  status_updated_at?: string;
  daysInStage?: number;
  deadlineUrgency?: DeadlineUrgency;
  resume_id?: string;
  cover_letter_id?: string;
  
  // Legacy fields for compatibility
  _id?: string;
  userId?: string;
  title?: string;
  company_name?: string;
  job_title?: string;
  status_history?: StatusHistoryEntry[];
  company_info?: any;
}

export interface JobStats {
  total: number;
  byStatus: {
    interested: number;
    applied: number;
    phoneScreen: number;
    interview: number;
    offer: number;
    rejected: number;
  };
  upcomingDeadlines: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    deadline: string;
    daysUntil: number;
  }>;
  recentActivity: Array<{
    jobId: string;
    jobTitle: string;
    company: string;
    status: JobStatus;
    updatedAt: string;
  }>;
}

export interface JobFilters {
  status?: JobStatus;
  isArchived?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateJobData {
  jobTitle: string;
  company: CompanyInfo;
  location?: string;
  jobType?: JobType;
  salaryMin?: number;
  salaryMax?: number;
  jobUrl?: string;
  jobDescription?: string;
  applicationDeadline?: string;
  status?: JobStatus;
  notes?: string;
}

export interface UpdateJobData extends Partial<CreateJobData> {
  contacts?: JobContact[];
  statusNotes?: string;
}
