import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useExport } from "@/hooks/useExport";

interface ApplicationMaterialsDialogProps {
  jobId: string;
  currentResumeId?: string;
  currentCoverLetterId?: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export function ApplicationMaterialsDialog({
  jobId,
  currentResumeId,
  currentCoverLetterId,
  isOpen,
  onClose,
  onUpdate
}: ApplicationMaterialsDialogProps) {
  const [resumes, setResumes] = useState<any[]>([]);
  const [coverLetters, setCoverLetters] = useState<any[]>([]);
  const [selectedResumeId, setSelectedResumeId] = useState(currentResumeId || "");
  const [selectedCoverLetterId, setSelectedCoverLetterId] = useState(currentCoverLetterId || "");
  const [isLoading, setIsLoading] = useState(false);
  const { exportResumeToPDF, exportCoverLetterToPDF } = useExport();

  useEffect(() => {
    if (isOpen) {
      loadMaterials();
    }
  }, [isOpen]);

  const loadMaterials = async () => {
    try {
      const [resumesData, coverLettersData] = await Promise.all([
        api.resumes.getAll(false),
        api.coverLetters.getAll(false)
      ]);
      setResumes(resumesData);
      setCoverLetters(coverLettersData);
    } catch (error) {
      toast.error("Failed to load materials");
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await api.jobs.update(jobId, {
        resume_id: selectedResumeId || null,
        cover_letter_id: selectedCoverLetterId || null
      });
      toast.success("Application materials updated");
      onUpdate();
      onClose();
    } catch (error) {
      toast.error("Failed to update materials");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewResume = async () => {
    if (!selectedResumeId) return;
    const resume = resumes.find(r => r.id === selectedResumeId);
    if (resume) {
      await exportResumeToPDF(resume);
    }
  };

  const handlePreviewCoverLetter = async () => {
    if (!selectedCoverLetterId) return;
    const coverLetter = coverLetters.find(c => c.id === selectedCoverLetterId);
    if (coverLetter) {
      await exportCoverLetterToPDF(coverLetter);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Application Materials</DialogTitle>
          <DialogDescription>
            Select which resume and cover letter versions to use for this application
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Resume Selection */}
          <div className="space-y-3">
            <Label>Resume</Label>
            <div className="flex gap-2">
              <Select value={selectedResumeId} onValueChange={setSelectedResumeId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a resume..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {resumes.map((resume) => (
                    <SelectItem key={resume.id} value={resume.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {resume.title}
                        {resume.is_default && (
                          <Badge variant="secondary" className="ml-2">Default</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedResumeId && selectedResumeId !== "none" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviewResume}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedResumeId && selectedResumeId !== "none" && (
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const resume = resumes.find(r => r.id === selectedResumeId);
                  return resume ? (
                    <div className="flex items-center gap-4 p-2 bg-muted/50 rounded">
                      <span>Template: {resume.template}</span>
                      <span>•</span>
                      <span>Sections: {resume.sections?.length || 0}</span>
                      <span>•</span>
                      <span>Last used: {resume.last_used ? new Date(resume.last_used).toLocaleDateString() : 'Never'}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Cover Letter Selection */}
          <div className="space-y-3">
            <Label>Cover Letter</Label>
            <div className="flex gap-2">
              <Select value={selectedCoverLetterId} onValueChange={setSelectedCoverLetterId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select a cover letter..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {coverLetters.map((letter) => (
                    <SelectItem key={letter.id} value={letter.id}>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {letter.title}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedCoverLetterId && selectedCoverLetterId !== "none" && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviewCoverLetter}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              )}
            </div>
            {selectedCoverLetterId && selectedCoverLetterId !== "none" && (
              <div className="text-sm text-muted-foreground">
                {(() => {
                  const letter = coverLetters.find(c => c.id === selectedCoverLetterId);
                  return letter ? (
                    <div className="flex items-center gap-4 p-2 bg-muted/50 rounded">
                      <span>Template: {letter.template}</span>
                      <span>•</span>
                      <span>Tone: {letter.tone}</span>
                      <span>•</span>
                      <span>Last used: {letter.last_used ? new Date(letter.last_used).toLocaleDateString() : 'Never'}</span>
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Selection"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
