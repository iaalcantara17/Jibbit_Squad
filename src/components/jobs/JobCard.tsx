import { Job, JobStatus } from '@/types/jobs';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, DollarSign, Calendar, ExternalLink, MoreVertical } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { format, differenceInDays } from 'date-fns';
import { cn } from '@/lib/utils';
import { mapDBStatusToUI } from '@/lib/jobStatusMapping';

interface JobCardProps {
  job: Job;
  onView?: (job: Job) => void;
  onEdit?: (job: Job) => void;
  onDelete?: (job: Job) => void;
  onArchive?: (job: Job) => void;
  onStatusChange?: (job: Job, status: Job['status']) => void;
  className?: string;
  compact?: boolean;
}

const statusColors: Record<JobStatus, string> = {
  'Interested': 'bg-muted text-muted-foreground',
  'Applied': 'bg-primary/10 text-primary',
  'Phone Screen': 'bg-accent/10 text-accent',
  'Interview': 'bg-warning/10 text-warning',
  'Offer': 'bg-success/10 text-success',
  'Rejected': 'bg-destructive/10 text-destructive',
};

const statusLabels: Record<JobStatus, string> = {
  'Interested': 'Interested',
  'Applied': 'Applied',
  'Phone Screen': 'Phone Screen',
  'Interview': 'Interview',
  'Offer': 'Offer',
  'Rejected': 'Rejected',
};

export const JobCard = ({
  job,
  onView,
  onEdit,
  onDelete,
  onArchive,
  onStatusChange,
  className,
  compact,
}: JobCardProps) => {
  const statusDate = job.status_updated_at || job.created_at;
  const daysInStage = statusDate ? differenceInDays(new Date(), new Date(statusDate)) : 0;
  const daysUntilDeadline = job.applicationDeadline
    ? differenceInDays(new Date(job.applicationDeadline), new Date())
    : null;

  const getDeadlineColor = () => {
    if (!daysUntilDeadline) return '';
    if (daysUntilDeadline < 0) return 'text-destructive';
    if (daysUntilDeadline <= 3) return 'text-warning';
    if (daysUntilDeadline <= 7) return 'text-warning/70';
    return 'text-muted-foreground';
  };

  return (
    <Card className={cn('hover-scale cursor-pointer', className)} onClick={() => onView?.(job)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold text-lg truncate">{job.job_title || (job as any).title}</h3>
            <p className="text-muted-foreground truncate">{job.company_name || (typeof (job as any).company === 'string' ? (job as any).company : (job as any).company?.name)}</p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
              {onEdit && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(job); }}>
                  Edit
                </DropdownMenuItem>
              )}
              {onArchive && (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(job); }}>
                  Archive
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); onDelete(job); }}
                  className="text-destructive"
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className={cn('font-medium', statusColors[mapDBStatusToUI(job.status) as JobStatus])}>
          {mapDBStatusToUI(job.status)}
        </Badge>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{job.location}</span>
          </div>

          {(job.salaryMin || job.salaryMax) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>
                {job.salaryMin && job.salaryMax
                  ? `$${job.salaryMin.toLocaleString()} - $${job.salaryMax.toLocaleString()}`
                  : job.salaryMin
                  ? `$${job.salaryMin.toLocaleString()}+`
                  : `Up to $${job.salaryMax?.toLocaleString()}`}
              </span>
            </div>
          )}

          {job.applicationDeadline && (
            <div className={cn('flex items-center gap-2', getDeadlineColor())}>
              <Calendar className="h-4 w-4" />
              <span>
                {daysUntilDeadline! < 0
                  ? 'Overdue'
                  : daysUntilDeadline === 0
                  ? 'Due today'
                  : `${daysUntilDeadline} days left`}
              </span>
            </div>
          )}

          {job.jobUrl && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-primary"
              onClick={(e) => {
                e.stopPropagation();
                window.open(job.jobUrl, '_blank');
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Posting
            </Button>
          )}
        </div>

        <div className="pt-2 border-t border-border text-xs text-muted-foreground">
          {daysInStage} {daysInStage === 1 ? 'day' : 'days'} in current stage
        </div>
      </CardContent>
    </Card>
  );
};
