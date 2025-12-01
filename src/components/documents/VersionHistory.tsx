import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Eye } from 'lucide-react';
import { format } from 'date-fns';

interface Version {
  version: number;
  timestamp: string;
  name?: string;
  snapshot: any;
}

interface VersionHistoryProps {
  versions: Version[];
  onRestore?: (version: Version) => void;
}

export const VersionHistory = ({ versions, onRestore }: VersionHistoryProps) => {
  if (!versions || versions.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5" />
          <h3 className="font-semibold">Version History</h3>
        </div>
        <p className="text-sm text-muted-foreground text-center py-8">
          No versions saved yet
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="h-5 w-5" />
        <h3 className="font-semibold">Version History ({versions.length})</h3>
      </div>

      <div className="space-y-3">
        {versions.map((version, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">
                    {version.name || `Version ${version.version}`}
                  </p>
                  {index === 0 && (
                    <Badge variant="secondary">Current</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(version.timestamp), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {index !== 0 && onRestore && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRestore(version)}
                  >
                    Restore
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
