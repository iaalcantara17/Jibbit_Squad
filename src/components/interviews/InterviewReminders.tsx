// Interview reminder banners for upcoming interviews
import { useEffect, useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, AlertCircle, Video, Building, Phone, Eye } from 'lucide-react';
import { format, differenceInHours, differenceInMinutes } from 'date-fns';
import { Interview } from '@/types/interviews';
import { Link } from 'react-router-dom';

interface InterviewRemindersProps {
  interviews: Interview[];
}

export const InterviewReminders = ({ interviews }: InterviewRemindersProps) => {
  const [upcomingInterviews, setUpcomingInterviews] = useState<Array<{ interview: Interview; timeUntil: string; urgency: 'high' | 'medium' }>>([]);

  useEffect(() => {
    const checkUpcoming = () => {
      const now = new Date();
      const upcoming: Array<{ interview: Interview; timeUntil: string; urgency: 'high' | 'medium' }> = [];

      interviews.forEach((interview) => {
        if (!interview.scheduled_start || interview.status !== 'scheduled') return;

        const interviewTime = new Date(interview.scheduled_start);
        const hoursUntil = differenceInHours(interviewTime, now);
        const minutesUntil = differenceInMinutes(interviewTime, now);

        // Show reminder for interviews within 24 hours
        if (hoursUntil >= 0 && hoursUntil < 24) {
          let timeUntil: string;
          let urgency: 'high' | 'medium';

          if (hoursUntil < 2) {
            // Within 2 hours - high urgency
            urgency = 'high';
            if (minutesUntil < 60) {
              timeUntil = `in ${minutesUntil} minute${minutesUntil !== 1 ? 's' : ''}`;
            } else {
              timeUntil = `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
            }
          } else {
            // 2-24 hours - medium urgency
            urgency = 'medium';
            timeUntil = `in ${hoursUntil} hour${hoursUntil !== 1 ? 's' : ''}`;
          }

          upcoming.push({ interview, timeUntil, urgency });
        }
      });

      // Sort by time (soonest first)
      upcoming.sort((a, b) => {
        const timeA = new Date(a.interview.scheduled_start!).getTime();
        const timeB = new Date(b.interview.scheduled_start!).getTime();
        return timeA - timeB;
      });

      setUpcomingInterviews(upcoming);
    };

    checkUpcoming();
    // Refresh every minute
    const interval = setInterval(checkUpcoming, 60000);

    return () => clearInterval(interval);
  }, [interviews]);

  if (upcomingInterviews.length === 0) return null;

  const getInterviewIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'remote':
        return <Video className="h-5 w-5" />;
      case 'onsite':
        return <Building className="h-5 w-5" />;
      case 'phone':
        return <Phone className="h-5 w-5" />;
      default:
        return <Calendar className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-3">
      {upcomingInterviews.map(({ interview, timeUntil, urgency }) => (
        <Alert 
          key={interview.id}
          variant={urgency === 'high' ? 'destructive' : 'default'}
          className="animate-in fade-in-50 slide-in-from-top-2"
        >
          <AlertCircle className="h-4 w-4" />
          <AlertTitle className="flex items-center gap-2">
            {getInterviewIcon(interview.interview_type || '')}
            Upcoming Interview {timeUntil}
          </AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            <div className="font-medium">
              {interview.job_id ? `Interview for job` : 'Interview scheduled'}
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {interview.scheduled_start && format(new Date(interview.scheduled_start), 'PPP p')}
              </span>
              {interview.location && (
                <span className="flex items-center gap-1">
                  <Building className="h-3 w-3" />
                  {interview.location}
                </span>
              )}
            </div>
            {interview.video_link && (
              <Button 
                size="sm" 
                variant="secondary" 
                className="mt-2"
                onClick={() => window.open(interview.video_link!, '_blank')}
              >
                <Video className="h-3 w-3 mr-1" />
                Join Video Call
              </Button>
            )}
            <Link to={`/interview/${interview.id}`}>
              <Button size="sm" variant="outline" className="mt-2">
                <Eye className="h-3 w-3 mr-1" />
                View Prep Checklist
              </Button>
            </Link>
            {interview.notes && (
              <p className="text-sm text-muted-foreground mt-2">{interview.notes}</p>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
