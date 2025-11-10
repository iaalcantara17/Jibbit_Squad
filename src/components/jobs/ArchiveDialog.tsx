import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ArchiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onArchive: (reason: string) => void;
  jobTitle: string;
}

const ARCHIVE_REASONS = [
  "Position filled",
  "Not a good fit",
  "Compensation too low",
  "Location not ideal",
  "Company culture mismatch",
  "Accepted another offer",
  "Other"
];

export const ArchiveDialog = ({ open, onOpenChange, onArchive, jobTitle }: ArchiveDialogProps) => {
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const handleArchive = () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;
    if (reason.trim()) {
      onArchive(reason);
      setSelectedReason("");
      setCustomReason("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Archive Job: {jobTitle}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Label>Why are you archiving this job?</Label>
          <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
            {ARCHIVE_REASONS.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <RadioGroupItem value={reason} id={reason} />
                <Label htmlFor={reason} className="font-normal cursor-pointer">
                  {reason}
                </Label>
              </div>
            ))}
          </RadioGroup>

          {selectedReason === "Other" && (
            <Textarea
              placeholder="Please specify..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              className="min-h-20"
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleArchive}
            disabled={!selectedReason || (selectedReason === "Other" && !customReason.trim())}
          >
            Archive Job
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
