import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Download, Eye, Save, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface ResumeBuilderProps {
  resumeId?: string;
  onSave?: () => void;
}

const TEMPLATES = [
  { id: 'chronological', name: 'Chronological', description: 'Traditional format highlighting work history' },
  { id: 'functional', name: 'Functional', description: 'Skills-focused format for career changers' },
  { id: 'hybrid', name: 'Hybrid', description: 'Combination of chronological and functional' },
  { id: 'modern', name: 'Modern', description: 'Contemporary design with visual elements' },
  { id: 'classic', name: 'Classic', description: 'Professional and conservative style' },
];

export function ResumeBuilder({ resumeId, onSave }: ResumeBuilderProps) {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('chronological');
  const [sections, setSections] = useState<any[]>([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIDialog, setShowAIDialog] = useState(false);

  const handleGenerateContent = async () => {
    if (!selectedJob) {
      toast.error('Please select a job to tailor your resume for');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.resumes.generateContent(
        resumeId || '',
        selectedJob,
        ['summary', 'experience', 'skills']
      );
      
      toast.success('AI content generated successfully!');
      setShowAIDialog(false);
      // Update sections with generated content
      // This would need proper implementation based on the response structure
    } catch (error) {
      toast.error('Failed to generate content');
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOptimizeSkills = async () => {
    if (!selectedJob) {
      toast.error('Please select a job to optimize skills for');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.resumes.optimizeSkills(selectedJob);
      toast.success('Skills optimized!');
      // Display optimization results
      console.log('Optimized skills:', result);
    } catch (error) {
      toast.error('Failed to optimize skills');
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTailorExperience = async () => {
    if (!selectedJob) {
      toast.error('Please select a job to tailor experience for');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.resumes.tailorExperience(selectedJob);
      toast.success('Experience tailored!');
      // Display tailored experience
      console.log('Tailored experience:', result);
    } catch (error) {
      toast.error('Failed to tailor experience');
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    try {
      if (resumeId) {
        await api.resumes.update(resumeId, { title, template, sections });
      } else {
        await api.resumes.create({ title, template, sections });
      }
      toast.success('Resume saved successfully!');
      onSave?.();
    } catch (error) {
      toast.error('Failed to save resume');
      console.error('Error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Resume Builder</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Resume Title</Label>
              <Input
                id="title"
                placeholder="e.g., Software Engineer Resume - Tech Startup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="template">Template</Label>
              <Select value={template} onValueChange={setTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      <div>
                        <div className="font-medium">{t.name}</div>
                        <div className="text-xs text-muted-foreground">{t.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Features */}
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">AI-Powered Features</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button variant="outline" onClick={() => setShowAIDialog(true)}>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Content
              </Button>
              <Button variant="outline" onClick={handleOptimizeSkills}>
                <Sparkles className="h-4 w-4 mr-2" />
                Optimize Skills
              </Button>
              <Button variant="outline" onClick={handleTailorExperience}>
                <Sparkles className="h-4 w-4 mr-2" />
                Tailor Experience
              </Button>
            </div>
          </div>

          {/* Sections Management */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Resume Sections</h3>
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Section
              </Button>
            </div>
            <div className="space-y-2">
              {sections.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No sections added yet. Click "Add Section" to get started.
                </p>
              ) : (
                sections.map((section, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{section.title}</h4>
                          <p className="text-sm text-muted-foreground">{section.type}</p>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Resume
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Generation Dialog */}
      <Dialog open={showAIDialog} onOpenChange={setShowAIDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate AI Content</DialogTitle>
            <DialogDescription>
              Select a job to tailor your resume content for, and AI will generate optimized content based on the job requirements.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="job-select">Select Job</Label>
              <Select value={selectedJob} onValueChange={setSelectedJob}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a job..." />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.job_title} at {job.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full" 
              onClick={handleGenerateContent}
              disabled={isGenerating || !selectedJob}
            >
              {isGenerating ? (
                <>Generating...</>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Content
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
