import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ExperienceEntry {
  id: string;
  company: string;
  role: string;
  description: string;
}

interface TailoredSuggestion {
  experience_id: string;
  relevance_score: number;
  suggested_markdown: string;
}

interface ExperienceTailoringPanelProps {
  jobId: string;
  experiences: ExperienceEntry[];
  onAcceptSuggestion: (experienceId: string, newContent: string) => void;
}

export const ExperienceTailoringPanel = ({
  jobId,
  experiences,
  onAcceptSuggestion,
}: ExperienceTailoringPanelProps) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<TailoredSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<TailoredSuggestion | null>(null);
  const [diffDialogOpen, setDiffDialogOpen] = useState(false);
  const { toast } = useToast();

  const handleTailor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-tailor-experience', {
        body: { jobId },
      });

      if (error) {
        if (error.message?.includes('429') || error.message?.includes('Rate limit')) {
          throw new Error('Rate limit exceeded. Please try again later.');
        }
        if (error.message?.includes('402') || error.message?.includes('credits')) {
          throw new Error('AI credits exhausted. Please add credits to continue.');
        }
        if (error.message?.includes('PROFILE_REQUIRED')) {
          throw new Error('Please complete your profile first');
        }
        throw error;
      }

      if (!data || !data.entries) {
        throw new Error('Invalid response from AI service');
      }

      setSuggestions(data.entries || []);
      toast({
        title: "Tailoring Complete",
        description: `Generated ${data.entries?.length || 0} suggestions`,
      });
    } catch (error: any) {
      console.error('Tailoring failed:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to tailor experiences",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDiff = (suggestion: TailoredSuggestion) => {
    setSelectedSuggestion(suggestion);
    setDiffDialogOpen(true);
  };

  const handleAccept = async (suggestion: TailoredSuggestion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save variant to database
      const { error } = await supabase
        .from('resume_experience_variants')
        .insert({
          user_id: user.id,
          resume_experience_id: suggestion.experience_id,
          job_id: jobId,
          content_markdown: suggestion.suggested_markdown,
          relevance_score: suggestion.relevance_score,
          accepted: true,
        });

      if (error) throw error;

      // Apply to resume
      onAcceptSuggestion(suggestion.experience_id, suggestion.suggested_markdown);

      toast({
        title: "Success",
        description: "Suggestion applied and saved as variant",
      });

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.experience_id !== suggestion.experience_id));
    } catch (error: any) {
      console.error('Failed to accept suggestion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save variant",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (suggestion: TailoredSuggestion) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Save rejected variant for history
      const { error } = await supabase
        .from('resume_experience_variants')
        .insert({
          user_id: user.id,
          resume_experience_id: suggestion.experience_id,
          job_id: jobId,
          content_markdown: suggestion.suggested_markdown,
          relevance_score: suggestion.relevance_score,
          accepted: false,
        });

      if (error) throw error;

      toast({
        title: "Rejected",
        description: "Suggestion saved to history",
      });

      // Remove from suggestions
      setSuggestions(prev => prev.filter(s => s.experience_id !== suggestion.experience_id));
    } catch (error: any) {
      console.error('Failed to reject suggestion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save rejection",
        variant: "destructive",
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-600";
    if (score >= 60) return "bg-yellow-600";
    return "bg-orange-600";
  };

  const getExperienceForId = (expId: string) => {
    return experiences.find(e => e.id === expId);
  };

  const renderSimpleDiff = (original: string, suggested: string) => {
    const origLines = original.split('\n');
    const suggLines = suggested.split('\n');
    
    return (
      <div className="space-y-1 font-mono text-sm">
        <div className="p-2 bg-red-50 dark:bg-red-950 border-l-4 border-red-500">
          <p className="text-xs text-muted-foreground mb-1">Original:</p>
          {origLines.map((line, i) => (
            <div key={`orig-${i}`} className="text-red-700 dark:text-red-300">
              - {line}
            </div>
          ))}
        </div>
        <div className="p-2 bg-green-50 dark:bg-green-950 border-l-4 border-green-500">
          <p className="text-xs text-muted-foreground mb-1">Suggested:</p>
          {suggLines.map((line, i) => (
            <div key={`sugg-${i}`} className="text-green-700 dark:text-green-300">
              + {line}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Experience Tailoring</span>
            <Button onClick={handleTailor} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Tailor Experiences
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Analyzing experiences...</p>
            </div>
          )}

          {suggestions.length > 0 && !loading && (
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const exp = getExperienceForId(suggestion.experience_id);
                return (
                  <div key={suggestion.experience_id} className="border rounded-md p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-semibold">{exp?.role || 'Experience'}</p>
                        <p className="text-sm text-muted-foreground">{exp?.company}</p>
                      </div>
                      <Badge className={getScoreColor(suggestion.relevance_score)}>
                        {suggestion.relevance_score}% match
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewDiff(suggestion)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Diff
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAccept(suggestion)}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleReject(suggestion)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {suggestions.length === 0 && !loading && (
            <p className="text-center text-muted-foreground py-8">
              Click "Tailor Experiences" to get suggestions optimized for this job
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={diffDialogOpen} onOpenChange={setDiffDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Experience Comparison</DialogTitle>
          </DialogHeader>
          {selectedSuggestion && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Relevance Score: <strong>{selectedSuggestion.relevance_score}%</strong>
                </p>
              </div>
              {renderSimpleDiff(
                getExperienceForId(selectedSuggestion.experience_id)?.description || '',
                selectedSuggestion.suggested_markdown
              )}
              <div className="flex space-x-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    handleAccept(selectedSuggestion);
                    setDiffDialogOpen(false);
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Accept Changes
                </Button>
                <Button
                  className="flex-1"
                  variant="outline"
                  onClick={() => {
                    handleReject(selectedSuggestion);
                    setDiffDialogOpen(false);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
