import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Star } from "lucide-react";

export interface ResumeTemplate {
  id: string;
  name: string;
  content_markdown: string;
  is_default: boolean;
  created_at: string;
}

interface ResumeTemplateManagerProps {
  onTemplateSelect?: (template: ResumeTemplate) => void;
}

export const ResumeTemplateManager = ({ onTemplateSelect }: ResumeTemplateManagerProps) => {
  const [templates, setTemplates] = useState<ResumeTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateContent, setTemplateContent] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('resume_templates')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleImportTemplate = async () => {
    if (!templateName.trim() || !templateContent.trim()) {
      toast({
        title: "Validation Error",
        description: "Please provide both template name and content",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (makeDefault) {
        await supabase
          .from('resume_templates')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { error } = await supabase
        .from('resume_templates')
        .insert({
          user_id: user.id,
          name: templateName.trim(),
          content_markdown: templateContent.trim(),
          is_default: makeDefault,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template imported successfully",
      });

      setImportDialogOpen(false);
      setTemplateName("");
      setTemplateContent("");
      setMakeDefault(false);
      loadTemplates();
    } catch (error) {
      console.error('Failed to import template:', error);
      toast({
        title: "Error",
        description: "Failed to import template",
        variant: "destructive",
      });
    }
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await supabase
        .from('resume_templates')
        .update({ is_default: false })
        .eq('user_id', user.id);

      const { error } = await supabase
        .from('resume_templates')
        .update({ is_default: true })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default template updated",
      });

      loadTemplates();
    } catch (error) {
      console.error('Failed to set default:', error);
      toast({
        title: "Error",
        description: "Failed to set default template",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('resume_templates')
        .delete()
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template deleted",
      });

      loadTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleRenameTemplate = async (templateId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('resume_templates')
        .update({ name: newName.trim() })
        .eq('id', templateId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Template renamed",
      });

      loadTemplates();
    } catch (error) {
      console.error('Failed to rename template:', error);
      toast({
        title: "Error",
        description: "Failed to rename template",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>My Templates</CardTitle>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Import Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Import Resume Template</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Template Name</Label>
                  <Input
                    id="template-name"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Technical Resume"
                    maxLength={100}
                  />
                </div>
                <div>
                  <Label htmlFor="template-content">Content (Markdown or Plain Text)</Label>
                  <Textarea
                    id="template-content"
                    value={templateContent}
                    onChange={(e) => setTemplateContent(e.target.value)}
                    placeholder="Paste your resume content here..."
                    rows={12}
                    maxLength={10000}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="make-default"
                    checked={makeDefault}
                    onCheckedChange={setMakeDefault}
                  />
                  <Label htmlFor="make-default">Set as default template</Label>
                </div>
                <Button onClick={handleImportTemplate} className="w-full">
                  Import Template
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading && <p className="text-center text-muted-foreground py-4">Loading...</p>}
        
        {!loading && templates.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No templates yet. Import your first template to get started.
          </p>
        )}

        {!loading && templates.length > 0 && (
          <div className="space-y-2">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-3 border rounded-md hover:bg-accent/50"
              >
                <div className="flex items-center space-x-2 flex-1">
                  {template.is_default && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                  <span className="font-medium">{template.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(template.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  {!template.is_default && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSetDefault(template.id)}
                      title="Set as default"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  {onTemplateSelect && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTemplateSelect(template)}
                    >
                      Use
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      const newName = prompt('Enter new name:', template.name);
                      if (newName && newName.trim()) {
                        handleRenameTemplate(template.id, newName);
                      }
                    }}
                  >
                    Rename
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
