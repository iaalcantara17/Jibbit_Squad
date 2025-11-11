import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Clock, Video, Phone, Building } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface InterviewSchedulerProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
  onSchedule: (interview: InterviewData) => Promise<void>;
}

export interface InterviewData {
  type: "phone" | "video" | "in-person";
  date: Date;
  time: string;
  duration: number;
  location?: string;
  interviewers?: string;
  notes?: string;
}

export const InterviewScheduler = ({ jobId, jobTitle, companyName, onSchedule }: InterviewSchedulerProps) => {
  const [type, setType] = useState<"phone" | "video" | "in-person">("video");
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("60");
  const [location, setLocation] = useState("");
  const [interviewers, setInterviewers] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();

  const handleSchedule = async () => {
    if (!date || !time) {
      toast({ title: "Please select date and time", variant: "destructive" });
      return;
    }

    try {
      await onSchedule({
        type,
        date,
        time,
        duration: parseInt(duration),
        location: type === "in-person" ? location : undefined,
        interviewers,
        notes,
      });

      toast({ title: "Interview scheduled successfully" });
      
      // Reset form
      setDate(undefined);
      setTime("");
      setLocation("");
      setInterviewers("");
      setNotes("");
    } catch (error) {
      toast({ title: "Failed to schedule interview", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Schedule Interview</CardTitle>
        <p className="text-sm text-muted-foreground">
          {jobTitle} at {companyName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Interview Type</Label>
          <Select value={type} onValueChange={(v: any) => setType(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="phone">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Screen
                </div>
              </SelectItem>
              <SelectItem value="video">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Video Call
                </div>
              </SelectItem>
              <SelectItem value="in-person">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  In-Person
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar mode="single" selected={date} onSelect={setDate} />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Time</Label>
            <Input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Label>Duration (minutes)</Label>
          <Select value={duration} onValueChange={setDuration}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
              <SelectItem value="120">2 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {type === "in-person" && (
          <div>
            <Label>Location</Label>
            <Input
              placeholder="Office address or meeting location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
        )}

        <div>
          <Label>Interviewers (optional)</Label>
          <Input
            placeholder="Names of interviewers, comma-separated"
            value={interviewers}
            onChange={(e) => setInterviewers(e.target.value)}
          />
        </div>

        <div>
          <Label>Notes (optional)</Label>
          <Textarea
            placeholder="Preparation notes, topics to discuss, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-20"
          />
        </div>

        <Button onClick={handleSchedule} className="w-full">
          <Clock className="h-4 w-4 mr-2" />
          Schedule Interview
        </Button>
      </CardContent>
    </Card>
  );
};
