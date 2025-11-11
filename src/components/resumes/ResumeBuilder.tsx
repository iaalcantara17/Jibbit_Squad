import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sparkles, Download, Eye, Save, Plus, Trash2, FileText } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { AIResultsPanel } from './AIResultsPanel';
import { useExport } from '@/hooks/useExport';

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
  const [aiResult, setAiResult] = useState<any>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { exportResumeToPDF, exportResumeToWord, exportResumeToText } = useExport();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const jobsData = await api.jobs.getAll();
      setJobs(jobsData);
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

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
      
      setAiResult({ type: 'content', data: result });
      toast.success('AI content generated successfully!');
      setShowAIDialog(false);
    } catch (error: any) {
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error('Failed to generate content');
      }
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
      setAiResult({ type: 'skills', data: result });
      toast.success('Skills optimized!');
    } catch (error: any) {
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error('Failed to optimize skills');
      }
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
      setAiResult({ type: 'experience', data: result });
      toast.success('Experience tailored!');
    } catch (error: any) {
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error('Failed to tailor experience');
      }
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAIResult = (data: any) => {
    // Apply the AI suggestions to the resume sections
    if (aiResult?.type === 'content') {
      // Merge AI content into existing sections
      const updatedSections = [...sections];
      if (data.summary) {
        const summaryIdx = updatedSections.findIndex(s => s.type === 'summary');
        if (summaryIdx >= 0) {
          updatedSections[summaryIdx].content = data.summary.suggestions?.[0] || updatedSections[summaryIdx].content;
        } else {
          updatedSections.unshift({ type: 'summary', title: 'Summary', content: data.summary.suggestions?.[0] || '', isVisible: true });
        }
      }
      setSections(updatedSections);
    } else if (aiResult?.type === 'skills') {
      // Update skills section
      const updatedSections = [...sections];
      const skillsIdx = updatedSections.findIndex(s => s.type === 'skills');
      const skillsContent = data.optimized?.map((s: any) => s.name).join(', ') || '';
      if (skillsIdx >= 0) {
        updatedSections[skillsIdx].content = skillsContent;
      } else {
        updatedSections.push({ type: 'skills', title: 'Skills', content: skillsContent, isVisible: true });
      }
      setSections(updatedSections);
    } else if (aiResult?.type === 'experience') {
      // Update experience section
      const updatedSections = [...sections];
      const expIdx = updatedSections.findIndex(s => s.type === 'experience');
      const expContent = data.tailored?.map((e: any) => 
        `${e.role} at ${e.company}\n${e.descriptions?.join('\n• ') || ''}`
      ).join('\n\n') || '';
      if (expIdx >= 0) {
        updatedSections[expIdx].content = expContent;
      } else {
        updatedSections.push({ type: 'experience', title: 'Experience', content: expContent, isVisible: true });
      }
      setSections(updatedSections);
    }
    setAiResult(null);
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    const resumeData = { id: resumeId, title, template, sections };
    try {
      if (format === 'pdf') {
        await exportResumeToPDF(resumeData);
      } else if (format === 'docx') {
        await exportResumeToWord(resumeData);
      } else {
        exportResumeToText(resumeData);
      }
      toast.success(`Resume exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
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
      {/* AI Results Panel */}
      {aiResult && (
        <AIResultsPanel
          result={aiResult}
          onApply={handleApplyAIResult}
          onDismiss={() => setAiResult(null)}
        />
      )}

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
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => {
                  const newSection = {
                    id: `section_${Date.now()}`,
                    type: 'custom',
                    title: 'New Section',
                    content: '',
                    order: sections.length,
                    isVisible: true
                  };
                  setSections([...sections, newSection]);
                  toast.success('Section added');
                }}
              >
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
                  <Card key={section.id || index}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Input
                          value={section.title}
                          onChange={(e) => {
                            const updated = [...sections];
                            updated[index].title = e.target.value;
                            setSections(updated);
                          }}
                          className="font-medium max-w-xs"
                        />
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setSections(sections.filter((_, i) => i !== index));
                            toast.success('Section removed');
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      <Textarea
                        value={section.content}
                        onChange={(e) => {
                          const updated = [...sections];
                          updated[index].content = e.target.value;
                          setSections(updated);
                        }}
                        placeholder="Enter section content..."
                        rows={4}
                      />
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center border-t pt-4">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowExportDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
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

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Resume</DialogTitle>
            <DialogDescription>
              Choose the format for exporting your resume
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-3 gap-4">
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                handleExport('pdf');
                setShowExportDialog(false);
              }}
            >
              <FileText className="h-8 w-8" />
              <span>PDF</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                handleExport('docx');
                setShowExportDialog(false);
              }}
            >
              <FileText className="h-8 w-8" />
              <span>Word</span>
            </Button>
            <Button
              variant="outline"
              className="h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => {
                handleExport('txt');
                setShowExportDialog(false);
              }}
            >
              <FileText className="h-8 w-8" />
              <span>Text</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
