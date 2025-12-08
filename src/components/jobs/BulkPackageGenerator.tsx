import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Package, Download, FileText, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useExport } from "@/hooks/useExport";

interface JobForPackage {
  id: string;
  job_title: string;
  company_name: string;
  resume_id?: string;
  cover_letter_id?: string;
  status: string;
}

interface BulkPackageGeneratorProps {
  jobs: JobForPackage[];
  onComplete?: () => void;
}

interface PackageStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  message?: string;
}

export const BulkPackageGenerator = ({ 
  jobs,
  onComplete 
}: BulkPackageGeneratorProps) => {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [includeResume, setIncludeResume] = useState(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [packageStatuses, setPackageStatuses] = useState<PackageStatus[]>([]);
  const { exportResumeToPDF, exportCoverLetterToPDF } = useExport();

  const eligibleJobs = jobs.filter(job => 
    job.status === 'interested' || job.status === 'applied'
  );

  const toggleJob = (jobId: string) => {
    const newSelected = new Set(selectedJobs);
    if (newSelected.has(jobId)) {
      newSelected.delete(jobId);
    } else {
      newSelected.add(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const selectAll = () => {
    if (selectedJobs.size === eligibleJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(eligibleJobs.map(j => j.id)));
    }
  };

  const handleGeneratePackages = async () => {
    if (selectedJobs.size === 0) {
      toast.error("Select at least one job");
      return;
    }

    if (!includeResume && !includeCoverLetter) {
      toast.error("Select at least one document type");
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setPackageStatuses([]);

    const selectedJobsList = eligibleJobs.filter(j => selectedJobs.has(j.id));
    const totalSteps = selectedJobsList.length;
    let completedSteps = 0;

    const statuses: PackageStatus[] = selectedJobsList.map(job => ({
      jobId: job.id,
      status: 'pending' as const
    }));
    setPackageStatuses(statuses);

    for (const job of selectedJobsList) {
      // Update status to processing
      setPackageStatuses(prev => 
        prev.map(s => s.jobId === job.id ? { ...s, status: 'processing' as const } : s)
      );

      try {
        // Generate resume if selected and available
        if (includeResume && job.resume_id) {
          const resume = await api.resumes.get(job.resume_id);
          await exportResumeToPDF(
            resume, 
            `${job.company_name}-${job.job_title}-Resume.pdf`.replace(/\s+/g, '-')
          );
        }

        // Generate cover letter if selected and available
        if (includeCoverLetter && job.cover_letter_id) {
          const coverLetter = await api.coverLetters.get(job.cover_letter_id);
          await exportCoverLetterToPDF(
            coverLetter,
            `${job.company_name}-${job.job_title}-CoverLetter.pdf`.replace(/\s+/g, '-')
          );
        }

        // Update status to success
        setPackageStatuses(prev => 
          prev.map(s => s.jobId === job.id ? { ...s, status: 'success' as const } : s)
        );
      } catch (error) {
        console.error(`Failed to generate package for ${job.job_title}:`, error);
        setPackageStatuses(prev => 
          prev.map(s => s.jobId === job.id ? { 
            ...s, 
            status: 'error' as const,
            message: 'Failed to generate package'
          } : s)
        );
      }

      completedSteps++;
      setProgress((completedSteps / totalSteps) * 100);
      
      // Small delay between jobs to avoid overwhelming the browser
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsGenerating(false);
    
    const successCount = packageStatuses.filter(s => s.status === 'success').length;
    toast.success(`Generated ${successCount} application packages`);
    
    onComplete?.();
  };

  const getStatusIcon = (status: PackageStatus['status']) => {
    switch (status) {
      case 'pending':
        return <div className="h-4 w-4 rounded-full border-2 border-muted-foreground" />;
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Bulk Application Package Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Generate application packages for multiple jobs at once
        </p>

        {/* Document selection */}
        <div className="flex gap-4 p-3 rounded-lg bg-muted">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bulk-resume"
              checked={includeResume}
              onCheckedChange={(checked) => setIncludeResume(!!checked)}
            />
            <Label htmlFor="bulk-resume" className="flex items-center gap-2 cursor-pointer">
              <FileText className="h-4 w-4" />
              Resumes
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bulk-cover"
              checked={includeCoverLetter}
              onCheckedChange={(checked) => setIncludeCoverLetter(!!checked)}
            />
            <Label htmlFor="bulk-cover" className="flex items-center gap-2 cursor-pointer">
              <Mail className="h-4 w-4" />
              Cover Letters
            </Label>
          </div>
        </div>

        {/* Job selection */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Select Jobs</Label>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedJobs.size === eligibleJobs.length ? "Deselect All" : "Select All"}
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-2">
            {eligibleJobs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No eligible jobs found. Jobs must be in "Interested" or "Applied" status.
              </p>
            ) : (
              eligibleJobs.map((job) => {
                const packageStatus = packageStatuses.find(s => s.jobId === job.id);
                return (
                  <div 
                    key={job.id}
                    className="flex items-center justify-between p-2 rounded hover:bg-muted"
                  >
                    <div className="flex items-center space-x-3">
                      {isGenerating ? (
                        packageStatus && getStatusIcon(packageStatus.status)
                      ) : (
                        <Checkbox
                          checked={selectedJobs.has(job.id)}
                          onCheckedChange={() => toggleJob(job.id)}
                        />
                      )}
                      <div>
                        <div className="text-sm font-medium">{job.job_title}</div>
                        <div className="text-xs text-muted-foreground">{job.company_name}</div>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {job.resume_id && (
                        <Badge variant="outline" className="text-xs">Resume</Badge>
                      )}
                      {job.cover_letter_id && (
                        <Badge variant="outline" className="text-xs">Cover</Badge>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Progress bar */}
        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generating packages...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <Button 
          onClick={handleGeneratePackages} 
          disabled={isGenerating || selectedJobs.size === 0}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Generate {selectedJobs.size} Package{selectedJobs.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
