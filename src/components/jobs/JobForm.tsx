import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2, Link2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { CreateJobData } from '@/types/jobs';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const jobSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  company: z.string().min(1, 'Company name is required'),
  location: z.string().min(1, 'Location is required'),
  salaryMin: z.number().optional(),
  salaryMax: z.number().optional(),
  jobPostingUrl: z.string().url().optional().or(z.literal('')),
  applicationDeadline: z.date().optional(),
  description: z.string().max(2000, 'Description must be less than 2000 characters'),
  industry: z.string().optional(),
  jobType: z.enum(['full-time', 'part-time', 'contract', 'internship', 'remote']).optional(),
  status: z.enum(['interested', 'applied', 'phone-screen', 'interview', 'offer', 'rejected']).optional(),
  notes: z.string().optional(),
});

type JobFormData = z.infer<typeof jobSchema>;

interface JobFormProps {
  initialData?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const JobForm = ({ initialData, onSuccess, onCancel }: JobFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importUrl, setImportUrl] = useState('');

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<JobFormData>({
    resolver: zodResolver(jobSchema),
    defaultValues: initialData,
  });

  const deadline = watch('applicationDeadline');

  const handleImportFromUrl = async () => {
    if (!importUrl) {
      toast.error('Please enter a job posting URL');
      return;
    }

    setIsImporting(true);
    try {
      const result = await api.jobImport.fromUrl(importUrl);
      
      if (result.success && result.data) {
        // Auto-populate form fields
        setValue('title', result.data.job_title || '');
        setValue('company', result.data.company_name || '');
        setValue('location', result.data.location || '');
        setValue('description', result.data.job_description || '');
        setValue('industry', result.data.industry || '');
        setValue('jobType', result.data.job_type?.toLowerCase() as any || undefined);
        setValue('salaryMin', result.data.salary_min || undefined);
        setValue('salaryMax', result.data.salary_max || undefined);
        setValue('jobPostingUrl', importUrl);
        
        toast.success('Job details imported successfully!');
        setImportUrl('');
      } else {
        toast.warning('Partial import - please review and fill in missing details');
      }
    } catch (error) {
      toast.error('Failed to import job details. Please enter manually.');
      console.error('Import error:', error);
    } finally {
      setIsImporting(false);
    }
  };

  const onSubmit = async (data: JobFormData) => {
    setIsSubmitting(true);
    try {
      const jobData = {
        job_title: data.title || '',
        company_name: data.company || '',
        location: data.location || '',
        job_description: data.description || '',
        salary_min: data.salaryMin,
        salary_max: data.salaryMax,
        job_url: data.jobPostingUrl,
        application_deadline: data.applicationDeadline?.toISOString().split('T')[0],
        status: data.status || 'interested',
        notes: data.notes,
      };

      await api.jobs.create(jobData);
      toast.success('Job added successfully');
      onSuccess?.();
    } catch (error) {
      toast.error('An error occurred while adding the job');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Import from URL */}
      <div className="space-y-2">
        <Label>Import from URL (Optional)</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Paste job posting URL"
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={handleImportFromUrl}
            disabled={isImporting || !importUrl}
          >
            {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
            Import
          </Button>
        </div>
      </div>

      {/* Basic Information */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="title">Job Title *</Label>
          <Input id="title" {...register('title')} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input id="company" {...register('company')} />
          {errors.company && <p className="text-sm text-destructive">{errors.company.message}</p>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location *</Label>
          <Input id="location" {...register('location')} />
          {errors.location && <p className="text-sm text-destructive">{errors.location.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Input id="industry" {...register('industry')} />
        </div>
      </div>

      {/* Job Type and Status */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="jobType">Job Type</Label>
          <Select onValueChange={(value) => setValue('jobType', value as any)}>
            <SelectTrigger>
              <SelectValue placeholder="Select job type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full-time">Full-time</SelectItem>
              <SelectItem value="part-time">Part-time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
              <SelectItem value="remote">Remote</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select onValueChange={(value) => setValue('status', value as any)} defaultValue="interested">
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="interested">Interested</SelectItem>
              <SelectItem value="applied">Applied</SelectItem>
              <SelectItem value="phone-screen">Phone Screen</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="offer">Offer</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Salary Range */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salaryMin">Minimum Salary</Label>
          <Input id="salaryMin" type="number" {...register('salaryMin', { valueAsNumber: true })} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="salaryMax">Maximum Salary</Label>
          <Input id="salaryMax" type="number" {...register('salaryMax', { valueAsNumber: true })} />
        </div>
      </div>

      {/* Deadline and URL */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Application Deadline</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !deadline && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={deadline}
                onSelect={(date) => setValue('applicationDeadline', date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="jobPostingUrl">Job Posting URL</Label>
          <Input id="jobPostingUrl" {...register('jobPostingUrl')} />
          {errors.jobPostingUrl && <p className="text-sm text-destructive">{errors.jobPostingUrl.message}</p>}
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Job Description</Label>
        <Textarea
          id="description"
          {...register('description')}
          rows={6}
          placeholder="Paste the job description here..."
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          {...register('notes')}
          rows={3}
          placeholder="Add any personal notes or observations..."
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {initialData ? 'Update Job' : 'Add Job'}
        </Button>
      </div>
    </form>
  );
};
