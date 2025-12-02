import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, X } from 'lucide-react';

interface AddChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const TECH_STACK_OPTIONS = [
  'javascript', 'typescript', 'python', 'java', 'react', 'node', 
  'sql', 'aws', 'docker', 'kubernetes', 'go', 'rust', 'c++'
];

const CATEGORIES = [
  'algorithms', 'data-structures', 'system-design', 'coding', 
  'debugging', 'optimization', 'database'
];

export function AddChallengeDialog({ open, onOpenChange, onSuccess }: AddChallengeDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [category, setCategory] = useState('');
  const [selectedTechStack, setSelectedTechStack] = useState<string[]>([]);

  const handleAddTech = (tech: string) => {
    if (!selectedTechStack.includes(tech)) {
      setSelectedTechStack([...selectedTechStack, tech]);
    }
  };

  const handleRemoveTech = (tech: string) => {
    setSelectedTechStack(selectedTechStack.filter(t => t !== tech));
  };

  const handleSubmit = async () => {
    if (!user || !title.trim() || !description.trim() || !category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('technical_challenges')
        .insert({
          title: title.trim(),
          problem_statement: description.trim(),
          difficulty,
          category,
          tech_stack: selectedTechStack,
          best_practices: null,
          hints: null,
          solution_framework: null
        });

      if (error) throw error;

      toast.success('Challenge created successfully!');
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setDifficulty('medium');
      setCategory('');
      setSelectedTechStack([]);
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error('Failed to create challenge');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Technical Challenge</DialogTitle>
          <DialogDescription>
            Add a new coding challenge to practice with
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Two Sum, Binary Tree Traversal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the problem statement, constraints, and expected output..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Select value={difficulty} onValueChange={(v: any) => setDifficulty(v)}>
                <SelectTrigger id="difficulty">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">
                      {cat.replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tech Stack (Optional)</Label>
            <Select onValueChange={handleAddTech}>
              <SelectTrigger>
                <SelectValue placeholder="Add technologies" />
              </SelectTrigger>
              <SelectContent>
                {TECH_STACK_OPTIONS.filter(t => !selectedTechStack.includes(t)).map(tech => (
                  <SelectItem key={tech} value={tech} className="capitalize">
                    {tech}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTechStack.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedTechStack.map(tech => (
                  <Badge key={tech} variant="secondary" className="capitalize">
                    {tech}
                    <button
                      onClick={() => handleRemoveTech(tech)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Challenge
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
