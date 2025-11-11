import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Share2, Copy, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";

interface ResumeShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeId: string;
}

interface Share {
  id: string;
  shared_with_email: string;
  access_level: string;
  share_token: string;
  created_at: string;
  expires_at: string | null;
}

export const ResumeShareDialog = ({
  open,
  onOpenChange,
  resumeId,
}: ResumeShareDialogProps) => {
  const [email, setEmail] = useState("");
  const [accessLevel, setAccessLevel] = useState("view");
  const [expiryDays, setExpiryDays] = useState("30");
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchShares();
    }
  }, [open, resumeId]);

  const fetchShares = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('resume_shares')
      .select('*')
      .eq('resume_id', resumeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching shares:', error);
      return;
    }

    setShares(data || []);
  };

  const generateShareToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const handleShare = async () => {
    if (!email) {
      toast.error("Please enter an email address");
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to share");
      setLoading(false);
      return;
    }

    const shareToken = generateShareToken();
    const expiresAt = expiryDays !== "never" 
      ? new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('resume_shares')
      .insert({
        resume_id: resumeId,
        user_id: user.id,
        shared_with_email: email,
        access_level: accessLevel,
        share_token: shareToken,
        expires_at: expiresAt,
      });

    if (error) {
      console.error('Error creating share:', error);
      toast.error("Failed to share resume");
    } else {
      toast.success(`Resume shared with ${email}`);
      setEmail("");
      fetchShares();
    }
    setLoading(false);
  };

  const handleCopyLink = (token: string) => {
    const link = `${window.location.origin}/shared-resume/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Link copied to clipboard!");
  };

  const handleDeleteShare = async (shareId: string) => {
    const { error } = await supabase
      .from('resume_shares')
      .delete()
      .eq('id', shareId);

    if (error) {
      console.error('Error deleting share:', error);
      toast.error("Failed to revoke access");
    } else {
      toast.success("Access revoked");
      fetchShares();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Share Resume
          </DialogTitle>
          <DialogDescription>
            Share your resume with others
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="access">Access level</Label>
            <Select value={accessLevel} onValueChange={setAccessLevel}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View only</SelectItem>
                <SelectItem value="comment">Can comment</SelectItem>
                <SelectItem value="edit">Can edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry">Link expires in</Label>
            <Select value={expiryDays} onValueChange={setExpiryDays}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="never">Never</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={handleShare} disabled={loading} className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Share Resume
          </Button>

          {shares.length > 0 && (
            <div className="space-y-2 pt-4 border-t">
              <Label>Active shares</Label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {shares.map((share) => (
                  <Card key={share.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {share.shared_with_email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {share.access_level} • 
                          {share.expires_at 
                            ? ` Expires ${new Date(share.expires_at).toLocaleDateString()}`
                            : ' Never expires'}
                        </p>
                      </div>
                      <div className="flex gap-1 ml-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleCopyLink(share.share_token)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteShare(share.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
