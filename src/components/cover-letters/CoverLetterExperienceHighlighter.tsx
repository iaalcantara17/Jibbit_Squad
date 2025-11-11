import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ExperienceHighlighterProps {
  coverLetterId: string;
  jobDescription: string;
  currentContent: string;
  onApply: (highlightedContent: string) => void;
}

export function CoverLetterExperienceHighlighter({
  coverLetterId,
  jobDescription,
  currentContent,
  onApply,
}: ExperienceHighlighterProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{
    original: string;
    highlighted: string;
    relevance: string;
    reason: string;
  }>>([]);

  const analyzeExperience = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to use this feature");
        return;
      }

      // Get user's profile data
      const { data: profile } = await supabase
        .from('profiles')
        .select('employment_history, skills, projects, education')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        toast.error("Please complete your profile first");
        return;
      }

      const { data, error } = await supabase.functions.invoke('ai-tailor-experience', {
        body: {
          jobDescription,
          currentContent,
          profile,
        },
      });

      if (error) throw error;

      setSuggestions(data.suggestions || []);
      toast.success("Experience analysis complete!");
    } catch (error) {
      console.error('Error analyzing experience:', error);
      toast.error("Failed to analyze experience");
    } finally {
      setLoading(false);
    }
  };

  const applyHighlight = (suggestion: typeof suggestions[0]) => {
    const newContent = currentContent.replace(
      suggestion.original,
      suggestion.highlighted
    );
    onApply(newContent);
    toast.success("Experience highlighted!");
  };

  const applyAllHighlights = () => {
    let newContent = currentContent;
    suggestions.forEach(suggestion => {
      newContent = newContent.replace(
        suggestion.original,
        suggestion.highlighted
      );
    });
    onApply(newContent);
    toast.success("All highlights applied!");
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Experience Highlighter
          </h3>
          <p className="text-sm text-muted-foreground">
            AI-powered suggestions to emphasize your most relevant experience
          </p>
        </div>
        <Button onClick={analyzeExperience} disabled={loading}>
          {loading ? "Analyzing..." : "Analyze"}
        </Button>
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              Found {suggestions.length} improvement{suggestions.length !== 1 ? 's' : ''}
            </p>
            <Button size="sm" onClick={applyAllHighlights}>
              Apply All
            </Button>
          </div>

          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <Card key={index} className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Badge variant={
                    suggestion.relevance === 'high' ? 'default' :
                    suggestion.relevance === 'medium' ? 'secondary' : 'outline'
                  }>
                    {suggestion.relevance} relevance
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current:</p>
                    <p className="text-sm bg-muted p-2 rounded">
                      {suggestion.original}
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Suggested:</p>
                    <p className="text-sm bg-primary/5 p-2 rounded border border-primary/20">
                      {suggestion.highlighted}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Why:</span> {suggestion.reason}
                  </p>
                </div>

                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => applyHighlight(suggestion)}
                >
                  Apply This Change
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
