// Centralized job status constants - single source of truth

export const JOB_STATUS = {
  INTERESTED: 'interested',
  APPLIED: 'applied',
  PHONE_SCREEN: 'phone_screen',
  INTERVIEW: 'interview',
  OFFER: 'offer',
  REJECTED: 'rejected',
} as const;

export type JobStatus = typeof JOB_STATUS[keyof typeof JOB_STATUS];

// UI display labels for statuses
export const STATUS_LABELS: Record<JobStatus, string> = {
  [JOB_STATUS.INTERESTED]: 'Interested',
  [JOB_STATUS.APPLIED]: 'Applied',
  [JOB_STATUS.PHONE_SCREEN]: 'Phone Screen',
  [JOB_STATUS.INTERVIEW]: 'Interview',
  [JOB_STATUS.OFFER]: 'Offer',
  [JOB_STATUS.REJECTED]: 'Rejected',
};

// Pipeline stage configuration
export const PIPELINE_STAGES = [
  { 
    id: JOB_STATUS.INTERESTED, 
    label: STATUS_LABELS[JOB_STATUS.INTERESTED], 
    color: 'bg-blue-500' 
  },
  { 
    id: JOB_STATUS.APPLIED, 
    label: STATUS_LABELS[JOB_STATUS.APPLIED], 
    color: 'bg-yellow-500' 
  },
  { 
    id: JOB_STATUS.PHONE_SCREEN, 
    label: STATUS_LABELS[JOB_STATUS.PHONE_SCREEN], 
    color: 'bg-purple-500' 
  },
  { 
    id: JOB_STATUS.INTERVIEW, 
    label: STATUS_LABELS[JOB_STATUS.INTERVIEW], 
    color: 'bg-orange-500' 
  },
  { 
    id: JOB_STATUS.OFFER, 
    label: STATUS_LABELS[JOB_STATUS.OFFER], 
    color: 'bg-green-500' 
  },
  { 
    id: JOB_STATUS.REJECTED, 
    label: STATUS_LABELS[JOB_STATUS.REJECTED], 
    color: 'bg-red-500' 
  },
];

// Convert DB status to UI label
export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status as JobStatus] || status;
}

// Validate if status is valid
export function isValidStatus(status: string): status is JobStatus {
  return Object.values(JOB_STATUS).includes(status as JobStatus);
}
