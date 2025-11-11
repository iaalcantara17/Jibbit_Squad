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
  const [contentType, setContentType] = useState<'summary' | 'experience' | 'skills'>('summary');

  const generateMutation = useMutation({
    mutationFn: async (type: 'summary' | 'experience' | 'skills') => {
      const { data, error } = await supabase.functions.invoke('ai-resume-content', {
        body: { jobId, sections: [type] },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setVariations(data.variations || []);
      toast.success(`Generated ${contentType} content`);
    },
    onError: (error: any) => {
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('Rate limit') || errorMsg.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (errorMsg.includes('credits') || errorMsg.includes('402')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error(`Failed to generate content: ${errorMsg}`);
      }
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
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={() => {
              setContentType('summary');
              generateMutation.mutate('summary');
            }}
            disabled={generateMutation.isPending}
            variant={contentType === 'summary' ? 'default' : 'outline'}
            size="sm"
          >
            {generateMutation.isPending && contentType === 'summary' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Summary
          </Button>
          <Button
            onClick={() => {
              setContentType('experience');
              generateMutation.mutate('experience');
            }}
            disabled={generateMutation.isPending}
            variant={contentType === 'experience' ? 'default' : 'outline'}
            size="sm"
          >
            {generateMutation.isPending && contentType === 'experience' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Experience
          </Button>
          <Button
            onClick={() => {
              setContentType('skills');
              generateMutation.mutate('skills');
            }}
            disabled={generateMutation.isPending}
            variant={contentType === 'skills' ? 'default' : 'outline'}
            size="sm"
          >
            {generateMutation.isPending && contentType === 'skills' ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate Skills
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
