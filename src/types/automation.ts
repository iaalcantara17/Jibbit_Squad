export type Status = 'Interested' | 'Applied' | 'Phone Screen' | 'Interview' | 'Offer' | 'Rejected';

export type StatusChangeTrigger = { 
  type: 'status_change'; 
  to: Status;
};

export type DeadlineTrigger = { 
  type: 'deadline'; 
  days_before: number;
};

export type DailyTrigger = { 
  type: 'schedule_daily'; 
  hour?: number;
};

export type Trigger = StatusChangeTrigger | DeadlineTrigger | DailyTrigger;

export type SendEmailAction = { 
  type: 'send_email'; 
  template_id?: string; 
  subject: string; 
  body: string;
};

export type ChangeStatusAction = { 
  type: 'change_status'; 
  to: Status;
};

export type GeneratePackageAction = { 
  type: 'generate_package'; 
  job_id?: string;
};

export type Action = SendEmailAction | ChangeStatusAction | GeneratePackageAction;

export interface AutomationRule {
  id?: string;
  user_id?: string;
  name: string;
  is_enabled: boolean;
  trigger: Trigger;
  action: Action;
}
