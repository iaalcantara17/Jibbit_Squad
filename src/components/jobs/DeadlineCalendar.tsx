import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Job, DeadlineUrgency } from '@/types/jobs';
import { format, isSameDay, differenceInDays } from 'date-fns';
import { Calendar as CalendarIcon, AlertCircle } from 'lucide-react';

interface DeadlineCalendarProps {
  jobs: Job[];
  onJobClick?: (job: Job) => void;
}

export function DeadlineCalendar({ jobs, onJobClick }: DeadlineCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  // Calculate deadline urgency
  const getDeadlineUrgency = (deadline: string): DeadlineUrgency => {
    const days = differenceInDays(new Date(deadline), new Date());
    if (days < 0) return 'overdue';
    if (days <= 2) return 'urgent';
    if (days <= 7) return 'soon';
    return 'normal';
  };

  // Get jobs with deadlines
  const jobsWithDeadlines = jobs.filter(job => job.applicationDeadline);

  // Get jobs for selected date
  const jobsForSelectedDate = selectedDate
    ? jobsWithDeadlines.filter(job => 
        isSameDay(new Date(job.applicationDeadline!), selectedDate)
      )
    : [];

  // Get upcoming deadlines (next 7 days)
  const upcomingDeadlines = jobsWithDeadlines
    .map(job => ({
      ...job,
      daysUntil: differenceInDays(new Date(job.applicationDeadline!), new Date()),
      urgency: getDeadlineUrgency(job.applicationDeadline!),
    }))
    .filter(job => job.daysUntil >= 0 && job.daysUntil <= 7)
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const urgencyColors: Record<DeadlineUrgency, string> = {
    overdue: 'bg-destructive text-destructive-foreground',
    urgent: 'bg-warning text-warning-foreground',
    soon: 'bg-accent text-accent-foreground',
    normal: 'bg-muted text-muted-foreground',
  };

  const urgencyLabels: Record<DeadlineUrgency, string> = {
    overdue: 'Overdue',
    urgent: 'Urgent (≤2 days)',
    soon: 'Soon (≤7 days)',
    normal: 'Normal',
  };

  // Modify calendar to highlight dates with deadlines
  const modifiers = {
    hasDeadline: jobsWithDeadlines.map(job => new Date(job.applicationDeadline!)),
  };

  const modifiersStyles = {
    hasDeadline: { 
      fontWeight: 'bold',
      backgroundColor: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      borderRadius: '50%',
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Application Deadlines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            className="rounded-md border"
          />

          {/* Jobs for selected date */}
          {jobsForSelectedDate.length > 0 && (
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold text-sm">
                {format(selectedDate!, 'MMMM d, yyyy')}
              </h3>
              {jobsForSelectedDate.map(job => (
                <div
                  key={job.id}
                  onClick={() => onJobClick?.(job)}
                  className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                >
                  <div className="font-medium">{job.jobTitle}</div>
                  <div className="text-sm text-muted-foreground">
                    {typeof job.company === 'string' ? job.company : job.company?.name}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Upcoming Deadlines (Next 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcomingDeadlines.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No upcoming deadlines in the next 7 days
            </p>
          ) : (
            upcomingDeadlines.map(job => (
              <div
                key={job.id}
                onClick={() => onJobClick?.(job)}
                className="p-4 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="font-medium">{job.jobTitle}</div>
                    <div className="text-sm text-muted-foreground">
                      {typeof job.company === 'string' ? job.company : job.company?.name}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(new Date(job.applicationDeadline!), 'MMMM d, yyyy')}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Badge className={urgencyColors[job.urgency]}>
                      {job.daysUntil === 0
                        ? 'Today'
                        : job.daysUntil === 1
                        ? 'Tomorrow'
                        : `${job.daysUntil} days`}
                    </Badge>
                    {job.urgency === 'overdue' && (
                      <span className="text-xs text-destructive font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Legend */}
          <div className="pt-4 border-t space-y-2">
            <p className="text-sm font-medium">Urgency Levels:</p>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(urgencyLabels).map(([key, label]) => (
                <div key={key} className="flex items-center gap-2">
                  <Badge className={urgencyColors[key as DeadlineUrgency]} variant="outline">
                    {label}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
