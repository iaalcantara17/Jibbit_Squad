import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Plus, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { InterviewWithDetails, InterviewChecklist } from '@/types/interviews';
import { cn } from '@/lib/utils';

interface InterviewChecklistCardProps {
  interview: InterviewWithDetails;
  onUpdate: () => void;
}

export const InterviewChecklistCard = ({ interview, onUpdate }: InterviewChecklistCardProps) => {
  const { user } = useAuth();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemLabel, setNewItemLabel] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Preparation');
  const [isAdding, setIsAdding] = useState(false);
  const [optimisticUpdates, setOptimisticUpdates] = useState<Set<string>>(new Set());

  const checklists = interview.checklists || [];
  const completed = checklists.filter(item => item.completed_at).length;
  const total = checklists.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  // Group by category
  const categories = Array.from(new Set(checklists.map(item => item.category || 'Other')));
  const groupedChecklists = categories.reduce((acc, category) => {
    acc[category] = checklists.filter(item => (item.category || 'Other') === category);
    return acc;
  }, {} as Record<string, InterviewChecklist[]>);

  // Get suggested items based on interview type and job
  const getSuggestedItems = () => {
    const suggestions: Array<{ label: string; category: string }> = [];
    
    // Format-specific suggestions
    if (interview.interview_type === 'remote' || interview.interview_type === 'video') {
      suggestions.push(
        { label: 'Test video and audio setup 30 minutes early', category: 'Logistics' },
        { label: 'Ensure stable internet connection', category: 'Logistics' },
        { label: 'Prepare backup device/internet plan', category: 'Logistics' }
      );
    }
    
    if (interview.interview_type === 'onsite') {
      suggestions.push(
        { label: 'Plan transportation and arrive 10-15 minutes early', category: 'Logistics' },
        { label: 'Bring physical copies of resume', category: 'Materials' },
        { label: 'Research office location and parking', category: 'Logistics' }
      );
    }

    if (interview.interview_type === 'phone') {
      suggestions.push(
        { label: 'Find quiet location with good signal', category: 'Logistics' },
        { label: 'Have resume and notes in front of you', category: 'Materials' }
      );
    }

    // Role-level suggestions (if we can infer from job title)
    const jobTitle = interview.job?.job_title?.toLowerCase() || '';
    
    if (jobTitle.includes('senior') || jobTitle.includes('lead') || jobTitle.includes('manager')) {
      suggestions.push(
        { label: 'Prepare examples of leadership and mentoring', category: 'Preparation' },
        { label: 'Review team scaling and architecture decisions', category: 'Preparation' }
      );
    }

    if (jobTitle.includes('junior') || jobTitle.includes('entry')) {
      suggestions.push(
        { label: 'Emphasize willingness to learn and grow', category: 'Preparation' },
        { label: 'Prepare questions about training and mentorship', category: 'Preparation' }
      );
    }

    // Filter out suggestions that are similar to existing items
    const existingLabels = checklists.map(item => item.label.toLowerCase());
    return suggestions.filter(suggestion => 
      !existingLabels.some(existing => 
        existing.includes(suggestion.label.toLowerCase().substring(0, 20))
      )
    );
  };

  const suggestedItems = getSuggestedItems();

  const handleToggleItem = async (item: InterviewChecklist) => {
    if (!user) return;

    // Optimistic update
    const optimisticId = item.id;
    setOptimisticUpdates(prev => new Set(prev).add(optimisticId));

    const previousState = item.completed_at;
    const newCompletedAt = item.completed_at ? null : new Date().toISOString();

    // Update local state immediately
    const updatedChecklists = checklists.map(c =>
      c.id === item.id ? { ...c, completed_at: newCompletedAt } : c
    );
    interview.checklists = updatedChecklists;

    try {
      const { error } = await supabase
        .from('interview_checklists')
        .update({ completed_at: newCompletedAt })
        .eq('id', item.id);

      if (error) throw error;

      // Refresh full data after successful update
      onUpdate();
    } catch (error) {
      console.error('Error toggling checklist item:', error);
      toast.error('Failed to update checklist item');
      
      // Rollback on failure
      interview.checklists = checklists.map(c =>
        c.id === item.id ? { ...c, completed_at: previousState } : c
      );
    } finally {
      setOptimisticUpdates(prev => {
        const next = new Set(prev);
        next.delete(optimisticId);
        return next;
      });
    }
  };

  const handleAddCustomItem = async () => {
    if (!user || !newItemLabel.trim()) {
      toast.error('Please enter a checklist item');
      return;
    }

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from('interview_checklists')
        .insert({
          interview_id: interview.id,
          user_id: user.id,
          label: newItemLabel.trim(),
          category: newItemCategory,
          is_required: false,
        });

      if (error) throw error;

      toast.success('Checklist item added');
      setNewItemLabel('');
      setNewItemCategory('Preparation');
      setShowAddForm(false);
      onUpdate();
    } catch (error) {
      console.error('Error adding checklist item:', error);
      toast.error('Failed to add checklist item');
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddSuggestedItem = async (suggestion: { label: string; category: string }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('interview_checklists')
        .insert({
          interview_id: interview.id,
          user_id: user.id,
          label: suggestion.label,
          category: suggestion.category,
          is_required: false,
        });

      if (error) throw error;

      toast.success('Checklist item added');
      onUpdate();
    } catch (error) {
      console.error('Error adding suggested item:', error);
      toast.error('Failed to add item');
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Interview Preparation Checklist</CardTitle>
            <CardDescription>
              {completed} of {total} items completed
            </CardDescription>
          </div>
          <div className="text-2xl font-bold text-primary">{percentage}%</div>
        </div>
        <Progress value={percentage} className="mt-4" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Checklist by Category */}
        {total === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No checklist items yet. Add your first item below!</p>
          </div>
        ) : (
          Object.entries(groupedChecklists).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h3>
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                      item.completed_at ? "bg-muted/50" : "hover:bg-muted/30"
                    )}
                  >
                    <Checkbox
                      checked={!!item.completed_at}
                      onCheckedChange={() => handleToggleItem(item)}
                      disabled={optimisticUpdates.has(item.id)}
                      className="mt-0.5"
                    />
                    <div className="flex-1">
                      <p className={cn(
                        "text-sm",
                        item.completed_at && "line-through text-muted-foreground"
                      )}>
                        {item.label}
                        {item.is_required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </p>
                      {item.completed_at && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Completed {new Date(item.completed_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    {item.completed_at ? (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}

        {/* Suggested Items */}
        {suggestedItems.length > 0 && (
          <div className="space-y-3 pt-4 border-t">
            <h3 className="font-semibold text-sm">Suggested Checklist Items</h3>
            <div className="space-y-2">
              {suggestedItems.map((suggestion, index) => (
                <div
                  key={index}
                  className="flex items-start justify-between gap-3 p-3 rounded-lg border border-dashed hover:bg-muted/30 transition-colors"
                >
                  <div className="flex-1">
                    <p className="text-sm">{suggestion.label}</p>
                    <p className="text-xs text-muted-foreground mt-1">{suggestion.category}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAddSuggestedItem(suggestion)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add Custom Item */}
        <div className="pt-4 border-t">
          {showAddForm ? (
            <div className="space-y-3">
              <Input
                placeholder="Enter checklist item..."
                value={newItemLabel}
                onChange={(e) => setNewItemLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleAddCustomItem();
                  }
                }}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Select value={newItemCategory} onValueChange={setNewItemCategory}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Research">Research</SelectItem>
                    <SelectItem value="Preparation">Preparation</SelectItem>
                    <SelectItem value="Materials">Materials</SelectItem>
                    <SelectItem value="Logistics">Logistics</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleAddCustomItem} disabled={isAdding} size="sm">
                  {isAdding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Add'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItemLabel('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Checklist Item
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
