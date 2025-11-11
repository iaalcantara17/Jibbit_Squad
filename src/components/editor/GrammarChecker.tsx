import { useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface GrammarCheckerProps {
  content: string;
  onApplySuggestion?: (correctedText: string) => void;
}

interface GrammarIssue {
  message: string;
  suggestion: string;
  severity: 'error' | 'warning' | 'info';
}

export const GrammarChecker = ({ content, onApplySuggestion }: GrammarCheckerProps) => {
  const [loading, setLoading] = useState(false);
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [correctedText, setCorrectedText] = useState('');
  const [checked, setChecked] = useState(false);

  const checkGrammar = async () => {
    if (!content.trim()) {
      toast.error('Please enter some content to check');
      return;
    }

    setLoading(true);
    setChecked(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('check-grammar', {
        body: { text: content },
      });

      if (error) throw error;

      setIssues(data.issues || []);
      setCorrectedText(data.correctedText || '');
      setChecked(true);

      if (data.issues.length === 0) {
        toast.success('No grammar issues found!');
      } else {
        toast.info(`Found ${data.issues.length} suggestion${data.issues.length > 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Grammar check error:', error);
      toast.error('Failed to check grammar');
    } finally {
      setLoading(false);
    }
  };

  const applyCorrectedText = () => {
    if (correctedText && onApplySuggestion) {
      onApplySuggestion(correctedText);
      toast.success('Corrections applied!');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <Button 
        onClick={checkGrammar} 
        disabled={loading || !content.trim()}
        variant="outline"
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Checking...
          </>
        ) : (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Check Grammar & Style
          </>
        )}
      </Button>

      {checked && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">
              {issues.length === 0 ? 'Great job!' : `${issues.length} Suggestion${issues.length > 1 ? 's' : ''}`}
            </h4>
            {issues.length > 0 && correctedText && (
              <Button size="sm" onClick={applyCorrectedText}>
                Apply All Corrections
              </Button>
            )}
          </div>

          {issues.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
              <p>Your text looks good! No issues found.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {issues.map((issue, index) => (
                <Card key={index} className="p-3">
                  <div className="flex items-start gap-2">
                    <Badge variant={getSeverityColor(issue.severity)} className="mt-1">
                      {getSeverityIcon(issue.severity)}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{issue.message}</p>
                      {issue.suggestion && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Suggestion: {issue.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {correctedText && (
            <div className="pt-4 border-t">
              <Label className="text-sm font-medium mb-2 block">Corrected Version:</Label>
              <div className="p-3 bg-accent rounded-md text-sm whitespace-pre-wrap">
                {correctedText}
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={className}>{children}</label>
);