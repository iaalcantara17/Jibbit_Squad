import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, RefreshCw, Check } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  jobId?: string;
  resumeId: string;
  onAccept: (content: string) => void;
}

export const AIContentGenerationPanel = ({ jobId, resumeId, onAccept }: Props) => {
  const [variations, setVariations] = useState<Array<{ content: string; atsScore: number; keywords: string[] }>>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('ai-resume-generate', {
        body: { resume_id: resumeId, job_id: jobId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setVariations(data.variations || []);
      toast.success('Generated content variations');
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI Content Generation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Variations
          </Button>
          {jobId && (
            <Badge variant="outline">Tailored for job</Badge>
          )}
        </div>

        <div className="grid gap-3">
          {variations.map((v, idx) => (
            <Card
              key={idx}
              className={`cursor-pointer transition-all ${
                selectedIndex === idx ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedIndex(idx)}
            >
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between">
                  <p className="text-sm flex-1">{v.content}</p>
                  {selectedIndex === idx && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onAccept(v.content);
                        toast.success('Content accepted');
                      }}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary">ATS: {v.atsScore}%</Badge>
                  {v.keywords.slice(0, 3).map((kw) => (
                    <Badge key={kw} variant="outline" className="text-xs">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
