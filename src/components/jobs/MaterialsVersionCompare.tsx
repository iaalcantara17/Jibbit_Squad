import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Version {
  id: string;
  title: string;
  content: string;
  created_at: string;
}

interface MaterialsVersionCompareProps {
  versions: Version[];
  type: 'resume' | 'cover-letter';
}

interface DiffLine {
  type: 'equal' | 'insert' | 'delete';
  oldIndex?: number;
  newIndex?: number;
  text: string;
}

// Simple LCS-based line diff
function computeLineDiff(oldLines: string[], newLines: string[]): DiffLine[] {
  const result: DiffLine[] = [];
  let i = 0, j = 0;

  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Remaining new lines are insertions
      result.push({ type: 'insert', newIndex: j, text: newLines[j] });
      j++;
    } else if (j >= newLines.length) {
      // Remaining old lines are deletions
      result.push({ type: 'delete', oldIndex: i, text: oldLines[i] });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      // Lines match
      result.push({ type: 'equal', oldIndex: i, newIndex: j, text: oldLines[i] });
      i++;
      j++;
    } else {
      // Lines differ - check if it's an insertion or deletion
      const oldInNew = newLines.indexOf(oldLines[i], j);
      const newInOld = oldLines.indexOf(newLines[j], i);

      if (oldInNew !== -1 && (newInOld === -1 || oldInNew - j < newInOld - i)) {
        // Insertion
        result.push({ type: 'insert', newIndex: j, text: newLines[j] });
        j++;
      } else {
        // Deletion
        result.push({ type: 'delete', oldIndex: i, text: oldLines[i] });
        i++;
      }
    }
  }

  return result;
}

export const MaterialsVersionCompare = ({ versions, type }: MaterialsVersionCompareProps) => {
  const [olderVersionId, setOlderVersionId] = useState(versions[1]?.id || '');
  const [newerVersionId, setNewerVersionId] = useState(versions[0]?.id || '');
  const { toast } = useToast();

  const diff = useMemo(() => {
    const olderVersion = versions.find(v => v.id === olderVersionId);
    const newerVersion = versions.find(v => v.id === newerVersionId);

    if (!olderVersion || !newerVersion) return [];

    const oldLines = olderVersion.content.split('\n');
    const newLines = newerVersion.content.split('\n');

    return computeLineDiff(oldLines, newLines);
  }, [olderVersionId, newerVersionId, versions]);

  const handleCopyNew = () => {
    const newerVersion = versions.find(v => v.id === newerVersionId);
    if (newerVersion) {
      navigator.clipboard.writeText(newerVersion.content);
      toast({
        title: "Copied",
        description: "Newer version copied to clipboard",
      });
    }
  };

  const swapVersions = () => {
    const temp = olderVersionId;
    setOlderVersionId(newerVersionId);
    setNewerVersionId(temp);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Version Comparison - {type === 'resume' ? 'Resume' : 'Cover Letter'}</CardTitle>
        <div className="flex items-center gap-2 pt-2">
          <Select value={olderVersionId} onValueChange={setOlderVersionId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select older version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.title} ({new Date(v.created_at).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="icon" onClick={swapVersions}>
            <ChevronLeft className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          <Select value={newerVersionId} onValueChange={setNewerVersionId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select newer version" />
            </SelectTrigger>
            <SelectContent>
              {versions.map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.title} ({new Date(v.created_at).toLocaleDateString()})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleCopyNew}>
            <Copy className="h-4 w-4 mr-2" />
            Copy New
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-lg overflow-auto max-h-96 bg-muted/20">
          <div className="font-mono text-sm">
            {diff.map((line, idx) => (
              <div
                key={idx}
                className={`px-4 py-1 ${
                  line.type === 'insert'
                    ? 'bg-green-500/10 text-green-700 dark:text-green-300'
                    : line.type === 'delete'
                    ? 'bg-red-500/10 text-red-700 dark:text-red-300'
                    : ''
                }`}
              >
                <span className="inline-block w-8 text-muted-foreground">
                  {line.type === 'insert' ? '+' : line.type === 'delete' ? '-' : ' '}
                </span>
                <span>{line.text || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
