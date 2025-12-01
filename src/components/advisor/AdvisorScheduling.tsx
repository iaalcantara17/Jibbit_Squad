import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';

interface AdvisorSchedulingProps {
  advisorId: string;
  hourlyRate?: number;
}

export const AdvisorScheduling = ({ advisorId, hourlyRate }: AdvisorSchedulingProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<string>('career_coaching');
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: advisor } = useQuery({
    queryKey: ['advisor', advisorId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('advisor_profiles')
        .select('*')
        .eq('id', advisorId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const bookSessionMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      if (!selectedDate || !selectedTime) throw new Error('Date and time required');

      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDateTime = new Date(selectedDate);
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      const { data, error } = await supabase
        .from('coaching_sessions')
        .insert({
          advisor_id: advisorId,
          client_user_id: user.id,
          session_type: sessionType,
          scheduled_date: scheduledDateTime.toISOString(),
          duration_minutes: 60,
          notes,
          status: 'scheduled',
        })
        .select()
        .single();

      if (error) throw error;

      // Create payment record
      if (hourlyRate && hourlyRate > 0) {
        await supabase.from('session_payments').insert({
          session_id: data.id,
          client_user_id: user.id,
          advisor_id: advisorId,
          amount: hourlyRate,
          status: 'pending',
        });
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-coaching-sessions'] });
      toast.success('Session booked successfully!');
      setSelectedDate(undefined);
      setSelectedTime('');
      setNotes('');
    },
    onError: (error: any) => {
      toast.error('Failed to book session: ' + error.message);
    },
  });

  const availableTimeSlots = [
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Schedule Session
        </CardTitle>
        <CardDescription>
          Book a coaching session with {advisor?.display_name || 'this advisor'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label>Session Type</Label>
          <Select value={sessionType} onValueChange={setSessionType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="career_coaching">Career Coaching</SelectItem>
              <SelectItem value="resume_review">Resume Review</SelectItem>
              <SelectItem value="interview_prep">Interview Prep</SelectItem>
              <SelectItem value="salary_negotiation">Salary Negotiation</SelectItem>
              <SelectItem value="job_search_strategy">Job Search Strategy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Select Date</Label>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            disabled={(date) => date < new Date() || date.getDay() === 0 || date.getDay() === 6}
            className="rounded-md border"
          />
        </div>

        {selectedDate && (
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Available Time Slots
            </Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {availableTimeSlots.map((time) => (
                <Button
                  key={time}
                  variant={selectedTime === time ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedTime(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div>
          <Label>Session Notes (Optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What would you like to focus on in this session?"
            rows={3}
          />
        </div>

        {hourlyRate && hourlyRate > 0 && (
          <div className="p-3 bg-muted rounded-lg">
            <p className="text-sm font-semibold">Session Fee: ${hourlyRate}</p>
            <p className="text-xs text-muted-foreground">Payment will be processed after booking</p>
          </div>
        )}

        <Button
          className="w-full"
          onClick={() => bookSessionMutation.mutate()}
          disabled={!selectedDate || !selectedTime || bookSessionMutation.isPending}
        >
          {bookSessionMutation.isPending ? 'Booking...' : 'Book Session'}
        </Button>
      </CardContent>
    </Card>
  );
};
