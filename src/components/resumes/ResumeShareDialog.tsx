import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Copy, Check, Share2 } from "lucide-react";

interface ResumeShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

export const ResumeShareDialog = ({ open, onOpenChange, resumeId }: ResumeShareDialogProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/shared/resume/${resumeId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({ title: "Link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: "Failed to copy link", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Resume
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Shareable Link</Label>
            <div className="flex gap-2 mt-2">
              <Input value={shareUrl} readOnly />
              <Button onClick={handleCopy} variant="outline">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Anyone with this link can view your resume. They won't be able to edit it.
            </p>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Privacy & Permissions</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Viewers can see your resume content</li>
              <li>• Viewers cannot edit or download</li>
              <li>• Link remains active until you delete the resume</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
