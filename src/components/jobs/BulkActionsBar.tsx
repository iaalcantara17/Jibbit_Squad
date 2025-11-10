import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, Trash2, CheckSquare } from "lucide-react";
import { JobStatus } from "@/types/jobs";
import { useToast } from "@/hooks/use-toast";

interface BulkActionsBarProps {
  selectedJobs: string[];
  onBulkStatusUpdate: (jobIds: string[], status: JobStatus) => Promise<void>;
  onBulkArchive: (jobIds: string[]) => Promise<void>;
  onBulkDelete: (jobIds: string[]) => Promise<void>;
  onClearSelection: () => void;
}

export const BulkActionsBar = ({
  selectedJobs,
  onBulkStatusUpdate,
  onBulkArchive,
  onBulkDelete,
  onClearSelection,
}: BulkActionsBarProps) => {
  const [newStatus, setNewStatus] = useState<JobStatus | "">("");
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  if (selectedJobs.length === 0) return null;

  const handleStatusUpdate = async () => {
    if (!newStatus) return;
    setIsProcessing(true);
    try {
      await onBulkStatusUpdate(selectedJobs, newStatus as JobStatus);
      toast({ title: `Updated ${selectedJobs.length} jobs` });
      onClearSelection();
    } catch (error) {
      toast({ title: "Update failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    setIsProcessing(true);
    try {
      await onBulkArchive(selectedJobs);
      toast({ title: `Archived ${selectedJobs.length} jobs` });
      onClearSelection();
    } catch (error) {
      toast({ title: "Archive failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${selectedJobs.length} jobs permanently?`)) return;
    setIsProcessing(true);
    try {
      await onBulkDelete(selectedJobs);
      toast({ title: `Deleted ${selectedJobs.length} jobs` });
      onClearSelection();
    } catch (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-background border rounded-lg shadow-lg p-4 flex items-center gap-4 z-50">
      <div className="flex items-center gap-2">
        <CheckSquare className="h-5 w-5" />
        <span className="font-medium">{selectedJobs.length} selected</span>
      </div>

      <div className="flex gap-2">
        <Select value={newStatus} onValueChange={(v) => setNewStatus(v as JobStatus)}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Interested">Interested</SelectItem>
            <SelectItem value="Applied">Applied</SelectItem>
            <SelectItem value="Phone Screen">Phone Screen</SelectItem>
            <SelectItem value="Interview">Interview</SelectItem>
            <SelectItem value="Offer">Offer</SelectItem>
            <SelectItem value="Rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={handleStatusUpdate} disabled={!newStatus || isProcessing}>
          Update
        </Button>
      </div>

      <Button variant="outline" onClick={handleArchive} disabled={isProcessing}>
        <Archive className="h-4 w-4 mr-2" />
        Archive
      </Button>

      <Button variant="destructive" onClick={handleDelete} disabled={isProcessing}>
        <Trash2 className="h-4 w-4 mr-2" />
        Delete
      </Button>

      <Button variant="ghost" onClick={onClearSelection}>
        Clear
      </Button>
    </div>
  );
};
