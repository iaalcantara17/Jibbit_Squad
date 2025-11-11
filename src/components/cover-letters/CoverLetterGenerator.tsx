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
      
      // Add research summary to content
      const researchSummary = `\n\n--- COMPANY RESEARCH ---\n\nCompany: ${research.companyInfo?.name || selectedJobData.company_name}\nIndustry: ${research.companyInfo?.industry || 'N/A'}\nMission: ${research.mission || 'N/A'}\n\nRecent News:\n${research.recentNews?.slice(0, 3).map((news: any, idx: number) => `${idx + 1}. ${news.title} (${news.date}): ${news.summary}`).join('\n') || 'No recent news found'}\n\n--- END RESEARCH ---\n`;
      setContent(prev => prev + researchSummary);
      
      toast.success('Company research completed and added to content');
    } catch (error: any) {
      if (error.message?.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (error.message?.includes('credits')) {
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
      const result = await api.coverLetters.generate(selectedJob, tone, template);
      
      // Handle different response formats and error cases
      if (!result) {
        throw new Error('No response from AI service');
      }
      
      // Check for error in response
      if (result.error) {
        const errorCode = result.error.code || result.error.message;
        if (errorCode === 'RATE_LIMIT' || result.error.message?.includes('Rate limit')) {
          throw new Error('Rate limit exceeded');
        }
        if (errorCode === 'PAYMENT_REQUIRED' || result.error.message?.includes('credits')) {
          throw new Error('AI credits exhausted');
        }
        throw new Error(result.error.message || 'Failed to generate cover letter');
      }
      
      let generatedContent = result.content;
      
      if (!generatedContent) {
        throw new Error('Generated content is empty');
      }

      // Integrate company research if available
      if (companyResearch) {
        const researchInsert = `\n\nI am particularly excited about ${companyResearch.companyInfo?.name || 'your company'}'s work in ${companyResearch.companyInfo?.industry || 'the industry'}. ${companyResearch.recentNews?.[0]?.summary ? `I was impressed to learn about ${companyResearch.recentNews[0].summary}` : ''}`;
        generatedContent = generatedContent.replace(/\n\nSincerely,/, researchInsert + '\n\nSincerely,');
      }

      setContent(generatedContent);
      toast.success('Cover letter generated successfully!');
    } catch (error: any) {
      const errorMsg = error.message || 'Unknown error';
      if (errorMsg.includes('Rate limit')) {
        toast.error("Rate limit exceeded. Please try again later.");
      } else if (errorMsg.includes('credits')) {
        toast.error("AI credits exhausted. Please add credits to continue.");
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

  const handleSave = async () => {
    if (!title || !content) {
      toast.error('Please provide a title and generate content first');
      return;
    }

    try {
      await api.coverLetters.create({
        title,
        template,
        tone,
        content,
        job_id: selectedJob || null,
      });
      toast.success('Cover letter saved successfully!');
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
              <Button variant="outline" disabled={!content}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
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
