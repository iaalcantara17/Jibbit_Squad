// Deadline utility functions

export type DeadlineStatus = 'safe' | 'warning' | 'urgent' | 'overdue';

export interface DeadlineInfo {
  status: DeadlineStatus;
  daysUntil: number;
  label: string;
  color: string;
  badgeClass: string;
}

/**
 * Calculate deadline status and styling information
 */
export function getDeadlineInfo(deadline: string | Date | null | undefined): DeadlineInfo | null {
  if (!deadline) return null;
  
  const deadlineDate = new Date(deadline);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);
  
  const daysUntil = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: DeadlineStatus;
  let label: string;
  let color: string;
  let badgeClass: string;
  
  if (daysUntil < 0) {
    status = 'overdue';
    label = `${Math.abs(daysUntil)} days overdue`;
    color = 'text-destructive';
    badgeClass = 'bg-destructive/10 text-destructive border-destructive';
  } else if (daysUntil === 0) {
    status = 'urgent';
    label = 'Due today';
    color = 'text-destructive';
    badgeClass = 'bg-destructive/10 text-destructive border-destructive';
  } else if (daysUntil <= 3) {
    status = 'urgent';
    label = `${daysUntil} days left`;
    color = 'text-orange-600';
    badgeClass = 'bg-orange-100 text-orange-700 border-orange-300';
  } else if (daysUntil <= 7) {
    status = 'warning';
    label = `${daysUntil} days left`;
    color = 'text-yellow-600';
    badgeClass = 'bg-yellow-100 text-yellow-700 border-yellow-300';
  } else {
    status = 'safe';
    label = `${daysUntil} days left`;
    color = 'text-green-600';
    badgeClass = 'bg-green-100 text-green-700 border-green-300';
  }
  
  return {
    status,
    daysUntil,
    label,
    color,
    badgeClass,
  };
}
