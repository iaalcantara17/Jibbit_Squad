import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Copy, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Version {
  id: string;
  name: string;
  createdAt: string;
  tailoredFor?: string;
  notes?: string;
}

interface ResumeVersionManagerProps {
  resumeId: string;
  versions: Version[];
  onRestore: (versionId: string) => Promise<void>;
  onDelete: (versionId: string) => Promise<void>;
  onCreate: (name: string, notes?: string) => Promise<void>;
}

export const ResumeVersionManager = ({
  resumeId,
  versions,
  onRestore,
  onDelete,
  onCreate,
}: ResumeVersionManagerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!newVersionName.trim()) {
      toast({ title: "Version name required", variant: "destructive" });
      return;
    }
    setIsCreating(true);
    try {
      await onCreate(newVersionName);
      setNewVersionName("");
      toast({ title: "Version created successfully" });
    } catch (error) {
      toast({ title: "Failed to create version", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Version History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New version name"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <Button onClick={handleCreate} disabled={isCreating}>
            <Copy className="h-4 w-4 mr-2" />
            Create Version
          </Button>
        </div>

        <div className="space-y-2">
          {versions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No versions yet. Create your first version to track changes.
            </p>
          ) : (
            versions.map((version) => (
              <div
                key={version.id}
                className="flex items-center justify-between p-3 border rounded-md"
              >
                <div className="flex-1">
                  <h4 className="font-medium">{version.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(version.createdAt), "PPp")}
                  </p>
                  {version.tailoredFor && (
                    <Badge variant="secondary" className="mt-1">
                      For: {version.tailoredFor}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(version.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(version.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
