import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Users, 
  Code, 
  Target, 
  Brain, 
  Star, 
  Play,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface QuestionBankItem {
  id: string;
  role_title: string;
  industry: string | null;
  category: 'behavioral' | 'technical' | 'situational';
  difficulty: 'entry' | 'mid' | 'senior';
  question_text: string;
  star_framework_hint: string | null;
  linked_skills: string[];
  source: string | null;
}

interface QuestionDetailDrawerProps {
  question: QuestionBankItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
  onStartPractice?: (questionId: string) => void;
}

export const QuestionDetailDrawer = ({ 
  question, 
  open, 
  onOpenChange,
  onUpdate,
  onStartPractice
}: QuestionDetailDrawerProps) => {
  const { user } = useAuth();
  const [isPracticing, setIsPracticing] = useState(false);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'behavioral':
        return <Users className="h-5 w-5" />;
      case 'technical':
        return <Code className="h-5 w-5" />;
      case 'situational':
        return <Target className="h-5 w-5" />;
      default:
        return <Brain className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'entry':
        return 'default';
      case 'mid':
        return 'secondary';
      case 'senior':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const startPractice = async () => {
    if (!user) {
      toast.error('Please sign in to practice questions');
      return;
    }

    setIsPracticing(true);
    try {
      // Check if practice record exists
      const { data: existingPractice, error: fetchError } = await supabase
        .from('question_practice')
        .select('*')
        .eq('user_id', user.id)
        .eq('question_id', question.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      if (existingPractice) {
        // Update existing practice record
        const { error: updateError } = await supabase
          .from('question_practice')
          .update({
            last_practiced_at: new Date().toISOString(),
            response_count: existingPractice.response_count + 1
          })
          .eq('id', existingPractice.id);

        if (updateError) throw updateError;
      } else {
        // Create new practice record
        const { error: insertError } = await supabase
          .from('question_practice')
          .insert({
            user_id: user.id,
            question_id: question.id,
            last_practiced_at: new Date().toISOString(),
            response_count: 1
          });

        if (insertError) throw insertError;
      }

      toast.success('Starting practice session!');
      onUpdate?.();
      onOpenChange(false);
      
      // Navigate to practice page if handler provided
      if (onStartPractice) {
        onStartPractice(question.id);
      }
    } catch (error) {
      console.error('Error starting practice:', error);
      toast.error('Failed to start practice session');
    } finally {
      setIsPracticing(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-2xl">Question Details</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Question */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Question</h3>
            <p className="text-base leading-relaxed">{question.question_text}</p>
          </div>

          <Separator />

          {/* Metadata */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Role</p>
                <p className="font-medium">{question.role_title}</p>
              </div>
              {question.industry && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Industry</p>
                  <p className="font-medium">{question.industry}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                  {getCategoryIcon(question.category)}
                  {question.category}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Difficulty</p>
                <Badge variant={getDifficultyColor(question.difficulty)} className="w-fit">
                  {question.difficulty}
                </Badge>
              </div>
            </div>
          </div>

          {/* Skills */}
          {question.linked_skills.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3">Skills Assessed</h3>
                <div className="flex flex-wrap gap-2">
                  {question.linked_skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* STAR Framework Hint */}
          {question.star_framework_hint && (
            <>
              <Separator />
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  STAR Framework Guide
                </h3>
                <p className="text-sm whitespace-pre-line leading-relaxed">
                  {question.star_framework_hint}
                </p>
              </div>
            </>
          )}

          {/* Source */}
          {question.source && (
            <>
              <Separator />
              <div>
                <p className="text-sm text-muted-foreground mb-1">Source</p>
                <p className="text-sm">{question.source}</p>
              </div>
            </>
          )}

          {/* Practice button */}
          <div className="pt-4">
            <Button 
              onClick={startPractice} 
              disabled={isPracticing || !user}
              className="w-full"
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              {isPracticing ? 'Starting Practice...' : 'Practice This Question'}
            </Button>
            {!user && (
              <p className="text-xs text-muted-foreground text-center mt-2">
                Sign in to track your practice progress
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="p-4 border rounded-lg space-y-2">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Take Your Time</p>
                <p className="text-sm text-muted-foreground">
                  Think through your answer before responding. It's okay to pause and organize your thoughts.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-sm">Be Specific</p>
                <p className="text-sm text-muted-foreground">
                  Use concrete examples and quantify results when possible. Specifics make your answer memorable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};