import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Star, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Template {
  id: string;
  title: string;
  content: string;
  tone: string;
  template: string;
  times_used: number;
}

export const CoverLetterTemplateLibrary = ({ onSelect }: { onSelect?: (template: Template) => void }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ name: '', content: '', tone: 'professional', tags: '' });
  const queryClient = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['cover-letter-templates'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('cover_letters')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('times_used', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (template: typeof newTemplate) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('cover_letters').insert({
        user_id: user.id,
        title: template.name,
        content: template.content,
        tone: template.tone,
        template: 'custom',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cover-letter-templates'] });
      toast.success('Template created');
      setIsCreating(false);
      setNewTemplate({ name: '', content: '', tone: 'professional', tags: '' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('cover_letters').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cover-letter-templates'] });
      toast.success('Template deleted');
    },
  });

  const updateUsageMutation = useMutation({
    mutationFn: async (id: string) => {
      const template = templates.find(t => t.id === id);
      if (!template) return;
      
      const { error } = await supabase
        .from('cover_letters')
        .update({ times_used: (template.times_used || 0) + 1, last_used: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cover-letter-templates'] });
    },
  });

  if (isLoading) return <div>Loading templates...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Template Library ({templates.length})
        </h3>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Template name"
                value={newTemplate.name}
                onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              />
              <Textarea
                placeholder="Template content..."
                value={newTemplate.content}
                onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                rows={8}
              />
              <Input
                placeholder="Tags (comma-separated)"
                value={newTemplate.tags}
                onChange={(e) => setNewTemplate({ ...newTemplate, tags: e.target.value })}
              />
              <Button
                onClick={() => createMutation.mutate(newTemplate)}
                disabled={!newTemplate.name || !newTemplate.content}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
            <CardHeader onClick={() => onSelect?.(template)}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {template.content.slice(0, 100)}...
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateUsageMutation.mutate(template.id);
                      onSelect?.(template);
                    }}
                    title="Use template"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this template?')) {
                        deleteMutation.mutate(template.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Badge variant="secondary">{template.tone}</Badge>
                <Badge variant="outline">Used {template.times_used} times</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
