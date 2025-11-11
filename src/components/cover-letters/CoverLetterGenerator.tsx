import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Download, Save, Copy, FileText, Building2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useExport } from '@/hooks/useExport';
import { CoverLetterResearchInjector } from './CoverLetterResearchInjector';
import { CoverLetterExportExtended } from './CoverLetterExportExtended';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const TEMPLATES = [
  { id: 'formal', name: 'Formal', description: 'Traditional business letter format' },
  { id: 'creative', name: 'Creative', description: 'Unique format for creative industries' },
  { id: 'technical', name: 'Technical', description: 'Focus on technical skills and achievements' },
  { id: 'casual', name: 'Casual', description: 'Conversational tone for startups' },
];

const TONES = [
  { id: 'formal', name: 'Formal', description: 'Professional and traditional' },
  { id: 'casual', name: 'Casual', description: 'Friendly and approachable' },
  { id: 'enthusiastic', name: 'Enthusiastic', description: 'Energetic and passionate' },
  { id: 'analytical', name: 'Analytical', description: 'Data-driven and logical' },
];

export function CoverLetterGenerator() {
  const [title, setTitle] = useState('');
  const [template, setTemplate] = useState('formal');
  const [tone, setTone] = useState('formal');
  const [selectedJob, setSelectedJob] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [content, setContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [companyResearch, setCompanyResearch] = useState<any>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { exportCoverLetterToPDF, exportCoverLetterToWord, exportCoverLetterToText } = useExport();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const result = await api.jobs.getAll();
      setJobs(result);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleResearchCompany = async () => {
    const selectedJobData = jobs.find(j => j.id === selectedJob);
    if (!selectedJobData) {
      toast.error('Please select a job first');
      return;
    }

    setIsResearching(true);
    try {
      const research = await api.company.research(
        selectedJobData.company_name,
        selectedJobData.company_info?.website
      );
      setCompanyResearch(research);
      toast.success('Company research completed');
    } catch (error: any) {
      if (error.message?.includes('Rate limit') || error.message?.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits') || error.message?.includes('402')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else {
        toast.error('Failed to research company');
      }
      console.error('Error:', error);
    } finally {
      setIsResearching(false);
    }
  };

  const handleGenerate = async () => {
    if (!selectedJob) {
      toast.error('Please select a job');
      return;
    }

    setIsGenerating(true);
    try {
      // Build enhanced prompt with company research
      const selectedJobData = jobs.find(j => j.id === selectedJob);
      let enhancedPrompt = '';
      
      if (companyResearch) {
        const companyName = companyResearch.companyInfo?.name || selectedJobData?.company_name;
        const industry = companyResearch.companyInfo?.industry;
        const mission = companyResearch.mission || '';
        const recentNews = companyResearch.recentNews?.[0];
        
        enhancedPrompt = `COMPANY RESEARCH CONTEXT:\n`;
        enhancedPrompt += `Company: ${companyName}\n`;
        if (industry) enhancedPrompt += `Industry: ${industry}\n`;
        if (mission) enhancedPrompt += `Mission: ${mission}\n`;
        if (recentNews?.title) {
          enhancedPrompt += `Recent Development: ${recentNews.title}`;
          if (recentNews.summary) enhancedPrompt += ` - ${recentNews.summary}`;
          enhancedPrompt += `\n`;
        }
        enhancedPrompt += `\nUSE THIS RESEARCH to write a personalized opening paragraph that demonstrates genuine interest in the company's current work and mission. Reference specific recent developments naturally.\n\n`;
      }

      const result = await api.coverLetters.generate(selectedJob, tone, template, enhancedPrompt);
      
      if (!result || !result.content) {
        throw new Error('No content generated');
      }

      setContent(result.content);
      toast.success('Cover letter generated successfully!');
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('Rate limit') || errorMsg.includes('429')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (errorMsg.includes('credits') || errorMsg.includes('402')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
      } else if (errorMsg.includes('non-2xx')) {
        toast.error("Failed to generate cover letter. Please try again.");
      } else if (errorMsg.includes('PROFILE_REQUIRED')) {
        toast.error('Please complete your profile first');
      } else {
        toast.error(`Failed to generate cover letter: ${errorMsg}`);
      }
      console.error('Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Re-generate when tone changes
  useEffect(() => {
    if (content && selectedJob && !isGenerating) {
      handleGenerate();
    }
  }, [tone]);

  const handleSave = async () => {
    if (!title || !content) {
      toast.error('Please provide a title and generate content first');
      return;
    }

    try {
      const savedLetter = await api.coverLetters.create({
        title,
        template,
        tone,
        content,
        job_id: selectedJob || null,
      });
      
      // Update job with cover letter link
      if (selectedJob && savedLetter?.id) {
        await api.jobs.update(selectedJob, {
          cover_letter_id: savedLetter.id,
        });
      }
      
      toast.success('Cover letter saved and linked to job!');
    } catch (error) {
      toast.error('Failed to save cover letter');
      console.error('Error:', error);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard!');
  };

  const handleExport = async (format: 'pdf' | 'docx' | 'txt') => {
    const coverLetterData = { title, content, template, tone };
    try {
      if (format === 'pdf') {
        await exportCoverLetterToPDF(coverLetterData);
      } else if (format === 'docx') {
        await exportCoverLetterToWord(coverLetterData);
      } else {
        exportCoverLetterToText(coverLetterData);
      }
      toast.success(`Cover letter exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Failed to export as ${format.toUpperCase()}`);
    }
  };

  const selectedJobData = jobs.find(j => j.id === selectedJob);

  return (
    <Tabs defaultValue="generator" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="generator">Generator</TabsTrigger>
        <TabsTrigger value="research">Research</TabsTrigger>
        <TabsTrigger value="export">Export</TabsTrigger>
      </TabsList>

      <TabsContent value="generator" className="space-y-6">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Configuration Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Cover Letter Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="cl-title">Title</Label>
            <Input
              id="cl-title"
              placeholder="e.g., Software Engineer - TechCorp"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

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

          <div>
            <Label htmlFor="tone">Tone & Style</Label>
            <Select value={tone} onValueChange={setTone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TONES.map((t) => (
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

          <div className="space-y-2">
            <Button 
              className="w-full" 
              variant="outline"
              onClick={handleResearchCompany}
              disabled={isResearching || !selectedJob}
            >
              {isResearching ? (
                <>Researching...</>
              ) : (
                <>
                  <Building2 className="h-4 w-4 mr-2" />
                  Research Company
                </>
              )}
            </Button>
            {companyResearch && (
              <div className="p-3 border rounded-lg bg-muted/50">
                <p className="text-sm font-medium mb-1">Research Complete</p>
                <p className="text-xs text-muted-foreground">
                  {companyResearch.companyInfo?.name} - {companyResearch.companyInfo?.industry}
                </p>
              </div>
            )}
          </div>

          <Button 
            className="w-full" 
            onClick={handleGenerate}
            disabled={isGenerating || !selectedJob}
          >
            {isGenerating ? (
              <>Generating...</>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Cover Letter
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Preview & Edit</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Your AI-generated cover letter will appear here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[400px] font-serif"
          />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {content.split(/\s+/).filter(Boolean).length} words
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCopy} disabled={!content}>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('pdf')} 
                disabled={!content}
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button 
                variant="outline" 
                onClick={() => handleExport('docx')} 
                disabled={!content}
              >
                <Download className="h-4 w-4 mr-2" />
                DOCX
              </Button>
              <Button onClick={handleSave} disabled={!content}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Cover Letter</DialogTitle>
            <DialogDescription>
              Choose the format for exporting your cover letter
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
      </TabsContent>

      <TabsContent value="research">
        {selectedJob && selectedJobData ? (
          <CoverLetterResearchInjector
            companyName={selectedJobData.company_name}
            onContentUpdate={(enriched) => {
              setContent(enriched);
              toast.success('Research injected into cover letter');
            }}
            initialContent={content}
          />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Please select a job and generate a cover letter first
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="export">
        {content ? (
          <CoverLetterExportExtended
            content={content}
            jobTitle={selectedJobData?.job_title || 'Position'}
            companyName={selectedJobData?.company_name || 'Company'}
          />
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              Generate a cover letter first to enable export options
            </CardContent>
          </Card>
        )}
      </TabsContent>
    </Tabs>
  );
}
