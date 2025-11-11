import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Wand2, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { useExport } from "@/hooks/useExport";
import { GrammarChecker } from "@/components/editor/GrammarChecker";

interface CoverLetterEditorProps {
  initialContent: string;
  jobTitle?: string;
  companyName?: string;
  onSave: (content: string, tone: string) => void;
  onGenerateAI?: (tone: string) => Promise<string>;
}

const TONE_OPTIONS = [
  { value: "formal", label: "Formal", description: "Traditional and professional" },
  { value: "casual", label: "Casual", description: "Friendly and approachable" },
  { value: "enthusiastic", label: "Enthusiastic", description: "Energetic and passionate" },
  { value: "analytical", label: "Analytical", description: "Data-driven and precise" },
];

export const CoverLetterEditor = ({ 
  initialContent, 
  jobTitle, 
  companyName, 
  onSave,
  onGenerateAI 
}: CoverLetterEditorProps) => {
  const [content, setContent] = useState(initialContent);
  const [tone, setTone] = useState("formal");
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { exportCoverLetterToPDF, exportCoverLetterToText } = useExport();

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(Boolean).length;
    const chars = content.length;
    setWordCount(words);
    setCharCount(chars);
    setHasChanges(content !== initialContent);
  }, [content, initialContent]);

  const handleGenerateAI = async () => {
    if (!onGenerateAI) return;
    
    setIsGenerating(true);
    try {
      const generated = await onGenerateAI(tone);
      setContent(generated);
      toast.success("Cover letter generated with AI");
    } catch (error) {
      toast.error("Failed to generate cover letter");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSave(content, tone);
    setHasChanges(false);
    toast.success("Cover letter saved");
  };

  const readabilityScore = () => {
    const sentences = content.split(/[.!?]+/).filter(Boolean).length;
    const avgWordsPerSentence = sentences > 0 ? wordCount / sentences : 0;
    
    if (avgWordsPerSentence < 15) return { score: "Excellent", color: "bg-green-500" };
    if (avgWordsPerSentence < 20) return { score: "Good", color: "bg-blue-500" };
    if (avgWordsPerSentence < 25) return { score: "Fair", color: "bg-yellow-500" };
    return { score: "Complex", color: "bg-red-500" };
  };

  const { score, color } = readabilityScore();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>
              Cover Letter Editor
              {jobTitle && companyName && (
                <p className="text-sm text-muted-foreground font-normal mt-1">
                  {jobTitle} at {companyName}
                </p>
              )}
            </CardTitle>
            <div className="flex gap-2">
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {onGenerateAI && (
                <Button
                  onClick={handleGenerateAI}
                  disabled={isGenerating}
                  variant="outline"
                >
                  <Wand2 className="h-4 w-4 mr-2" />
                  {isGenerating ? "Generating..." : "AI Generate"}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your cover letter here..."
              className="min-h-[400px] font-serif text-base leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>{wordCount} words</span>
              <span>{charCount} characters</span>
              <div className="flex items-center gap-2">
                <span>Readability:</span>
                <Badge className={color}>{score}</Badge>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => exportCoverLetterToText(content)}
              >
                <Download className="h-4 w-4 mr-2" />
                Text
              </Button>
              <Button
                variant="outline"
                onClick={() => exportCoverLetterToPDF(content, jobTitle || "Cover Letter")}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-3">
            <p className="text-sm font-medium mb-1">Selected Tone: {TONE_OPTIONS.find(t => t.value === tone)?.label}</p>
            <p className="text-sm text-muted-foreground">
              {TONE_OPTIONS.find(t => t.value === tone)?.description}
            </p>
          </div>

          <div className="mt-4">
            <GrammarChecker 
              content={content} 
              onApplySuggestion={(corrected) => setContent(corrected)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
