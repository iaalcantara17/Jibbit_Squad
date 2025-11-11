import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Package, Download, FileText, Mail } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useExport } from "@/hooks/useExport";

interface ApplicationPackageGeneratorProps {
  jobId: string;
  jobTitle: string;
  companyName: string;
}

export const ApplicationPackageGenerator = ({ 
  jobId, 
  jobTitle, 
  companyName 
}: ApplicationPackageGeneratorProps) => {
  const [includeResume, setIncludeResume] = useState(true);
  const [includeCoverLetter, setIncludeCoverLetter] = useState(true);
  const [includePortfolio, setIncludePortfolio] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { exportResumeToPDF, exportCoverLetterToPDF } = useExport();

  const handleGeneratePackage = async () => {
    if (!includeResume && !includeCoverLetter && !includePortfolio) {
      toast.error("Select at least one item to include");
      return;
    }

    setIsGenerating(true);
    try {
      const job = await api.jobs.get(jobId);
      
      // Get linked materials
      if (includeResume && job.resume_id) {
        const resume = await api.resumes.get(job.resume_id);
        await exportResumeToPDF(
          resume, 
          `${companyName}-${jobTitle}-Resume.pdf`.replace(/\s+/g, '-')
        );
      }

      if (includeCoverLetter && job.cover_letter_id) {
        const coverLetter = await api.coverLetters.get(job.cover_letter_id);
        await exportCoverLetterToPDF(
          coverLetter,
          `${companyName}-${jobTitle}-CoverLetter.pdf`.replace(/\s+/g, '-')
        );
      }

      toast.success("Application package generated successfully");
    } catch (error) {
      console.error("Failed to generate package:", error);
      toast.error("Failed to generate application package");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Application Package Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            Generate a complete application package for {jobTitle} at {companyName}
          </p>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="resume"
                checked={includeResume}
                onCheckedChange={(checked) => setIncludeResume(!!checked)}
              />
              <Label htmlFor="resume" className="flex items-center gap-2 cursor-pointer">
                <FileText className="h-4 w-4" />
                Include Resume
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="coverLetter"
                checked={includeCoverLetter}
                onCheckedChange={(checked) => setIncludeCoverLetter(!!checked)}
              />
              <Label htmlFor="coverLetter" className="flex items-center gap-2 cursor-pointer">
                <Mail className="h-4 w-4" />
                Include Cover Letter
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="portfolio"
                checked={includePortfolio}
                onCheckedChange={(checked) => setIncludePortfolio(!!checked)}
              />
              <Label htmlFor="portfolio" className="flex items-center gap-2 cursor-pointer">
                <Package className="h-4 w-4" />
                Include Portfolio Link
              </Label>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleGeneratePackage} 
          disabled={isGenerating}
          className="w-full"
        >
          <Download className="h-4 w-4 mr-2" />
          {isGenerating ? "Generating..." : "Generate Application Package"}
        </Button>

        <div className="rounded-lg bg-muted p-3">
          <p className="text-xs text-muted-foreground">
            All documents will be downloaded with consistent naming for easy submission
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
