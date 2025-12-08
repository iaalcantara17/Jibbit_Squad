import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, Send, X, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ScheduledSubmission {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  scheduledDate: Date;
  scheduledTime: string;
  status: 'pending' | 'sent' | 'cancelled';
  includeResume: boolean;
  includeCoverLetter: boolean;
}

interface ScheduledSubmissionProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSchedule?: (submission: Omit<ScheduledSubmission, 'id' | 'status'>) => void;
}

export const ScheduledSubmission = ({ 
  jobId, 
  jobTitle, 
  companyName,
  onSchedule 
}: ScheduledSubmissionProps) => {
  const [scheduledDate, setScheduledDate] = useState<Date>();
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [includeResume, setIncludeResume] = useState(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);

  const timeOptions = [
    "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
    "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"
  ];

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error("Please select a date for submission");
      return;
    }

    if (!includeResume && !includeCoverLetter) {
      toast.error("Please include at least one document");
      return;
    }

    setIsScheduling(true);
    try {
      const submission = {
        jobId,
        jobTitle,
        companyName,
        scheduledDate,
        scheduledTime,
        includeResume,
        includeCoverLetter,
      };

      onSchedule?.(submission);
      
      toast.success(
        `Application scheduled for ${format(scheduledDate, 'PPP')} at ${scheduledTime}`,
        {
          description: `Materials will be prepared for ${companyName}`
        }
      );
      
      // Reset form
      setScheduledDate(undefined);
    } catch (error) {
      console.error("Failed to schedule submission:", error);
      toast.error("Failed to schedule submission");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="h-5 w-5" />
          Schedule Application Submission
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Schedule your application for optimal timing based on research
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Submission Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !scheduledDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {scheduledDate ? format(scheduledDate, "PPP") : "Select date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={scheduledDate}
                  onSelect={setScheduledDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Submission Time</Label>
            <Select value={scheduledTime} onValueChange={setScheduledTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeOptions.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="include-resume" className="cursor-pointer">
                Include Resume
              </Label>
              <Switch
                id="include-resume"
                checked={includeResume}
                onCheckedChange={setIncludeResume}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="include-cover" className="cursor-pointer">
                Include Cover Letter
              </Label>
              <Switch
                id="include-cover"
                checked={includeCoverLetter}
                onCheckedChange={setIncludeCoverLetter}
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          <p className="font-medium mb-1">Optimal Submission Tips:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Tuesday-Thursday mornings often see higher response rates</li>
            <li>Avoid Monday mornings and Friday afternoons</li>
            <li>Research company timezone for best timing</li>
          </ul>
        </div>

        <Button 
          onClick={handleSchedule} 
          disabled={isScheduling || !scheduledDate}
          className="w-full"
        >
          <Send className="h-4 w-4 mr-2" />
          {isScheduling ? "Scheduling..." : "Schedule Submission"}
        </Button>
      </CardContent>
    </Card>
  );
};

// Component for displaying scheduled submissions list
interface ScheduledSubmissionsListProps {
  submissions: ScheduledSubmission[];
  onCancel?: (id: string) => void;
}

export const ScheduledSubmissionsList = ({ 
  submissions, 
  onCancel 
}: ScheduledSubmissionsListProps) => {
  if (submissions.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          No scheduled submissions
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Scheduled Submissions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {submissions.map((submission) => (
          <div 
            key={submission.id}
            className="flex items-center justify-between p-3 rounded-lg border"
          >
            <div className="space-y-1">
              <div className="font-medium text-sm">{submission.jobTitle}</div>
              <div className="text-xs text-muted-foreground">
                {submission.companyName}
              </div>
              <div className="flex items-center gap-2 text-xs">
                <CalendarIcon className="h-3 w-3" />
                {format(submission.scheduledDate, 'PPP')} at {submission.scheduledTime}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {submission.status === 'pending' && (
                <>
                  <Badge variant="outline">Pending</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onCancel?.(submission.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
              {submission.status === 'sent' && (
                <Badge className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Sent
                </Badge>
              )}
              {submission.status === 'cancelled' && (
                <Badge variant="secondary">Cancelled</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
