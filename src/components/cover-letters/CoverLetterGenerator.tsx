import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Download, Save, Copy } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

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

  const handleGenerate = async () => {
    if (!selectedJob) {
      toast.error('Please select a job');
      return;
    }

    setIsGenerating(true);
    try {
      const result = await api.coverLetters.generate(selectedJob, tone, template);
      setContent(result.content);
      toast.success('Cover letter generated successfully!');
    } catch (error) {
      toast.error('Failed to generate cover letter');
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

  return (
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
    </div>
  );
}
