import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ApplicationMaterialsSectionProps {
  jobId: string;
  resumeId?: string;
  coverLetterId?: string;
  onUpdate: (materials: { resumeId?: string; coverLetterId?: string }) => void;
}

export const ApplicationMaterialsSection = ({
  jobId,
  resumeId,
  coverLetterId,
  onUpdate,
}: ApplicationMaterialsSectionProps) => {
  const [resumes, setResumes] = useState<any[]>([]);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState(resumeId || "");
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState(coverLetterId || "");
  const { toast } = useToast();

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const [resumesData, coverLettersData] = await Promise.all([
        api.resumes.getAll(),
        api.coverLetters.getAll()
      ]);
      setResumes(resumesData);
      setCoverLetters(coverLettersData);
    } catch (error) {
      console.error('Failed to load materials:', error);
    }
  };

  const handleUpdate = async () => {
    try {
      onUpdate({
        resumeId: selectedResumeId || undefined,
        coverLetterId: selectedCoverLetterId || undefined,
      });

      // Track materials usage
      const selectedResume = resumes.find(r => r.id === selectedResumeId);
      const selectedCoverLetter = coverLetters.find(cl => cl.id === selectedCoverLetterId);

      if (selectedResume || selectedCoverLetter) {
        const { data: { user } } = await api.auth.getUser();
        if (user) {
          await api.materialsUsage.add({
            jobId,
            resumeId: selectedResumeId || null,
            coverLetterId: selectedCoverLetterId || null,
            notes: null,
          });
        }
      }

      toast({
        title: "Materials Updated",
        description: "Application materials have been linked to this job",
      });
    } catch (error) {
      console.error('Failed to update materials:', error);
      toast({
        title: "Error",
        description: "Failed to update materials",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Application Materials
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Resume</label>
          <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a resume" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {resumes.map((resume) => (
                <SelectItem key={resume.id} value={resume.id}>
                  {resume.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium mb-2 block">Cover Letter</label>
          <Select value={selectedCoverLetterId} onValueChange={setSelectedCoverLetterId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a cover letter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {coverLetters.map((letter) => (
                <SelectItem key={letter.id} value={letter.id}>
                  {letter.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleUpdate} className="w-full">
          Update Materials
        </Button>

        {(selectedResumeId || selectedCoverLetterId) && (
          <div className="flex gap-2 pt-2">
            {selectedResumeId && (
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Resume
              </Button>
            )}
            {selectedCoverLetterId && (
              <Button variant="outline" size="sm" className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Download Cover Letter
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
