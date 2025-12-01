import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Plus, 
  X, 
  Sparkles, 
  Building2, 
  TrendingUp, 
  Users, 
  Target,
  Download,
  History,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';

interface Source {
  url?: string;
  text?: string;
  label: string;
}

interface ResearchReport {
  overview: {
    mission?: string;
    values?: string;
    source?: string;
  };
  recentDevelopments: Array<{
    title: string;
    summary: string;
    date?: string;
    source: string;
  }>;
  leadership: Array<{
    name: string;
    title: string;
    bio?: string;
    source: string;
  }>;
  competitiveLandscape: {
    content: string;
    source?: string;
  };
  talkingPoints: string[];
  questions: {
    roleSpecific: string[];
    companySpecific: string[];
  };
  generatedAt: string;
}

interface CompanyResearchReportProps {
  interviewId: string;
  companyName: string;
  jobTitle: string;
  currentResearch?: any;
  onUpdate: () => void;
}

export const CompanyResearchReport = ({ 
  interviewId, 
  companyName, 
  jobTitle,
  currentResearch,
  onUpdate 
}: CompanyResearchReportProps) => {
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [sources, setSources] = useState<Source[]>([]);
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [newSourceText, setNewSourceText] = useState('');
  const [newSourceLabel, setNewSourceLabel] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<ResearchReport | null>(
    currentResearch?.versions?.[0]?.report || null
  );
  const [selectedVersion, setSelectedVersion] = useState(0);
  const [isPrintView, setIsPrintView] = useState(false);

  const versions = currentResearch?.versions || [];

  const addSource = () => {
    if (!newSourceLabel) {
      toast.error('Please provide a label for the source');
      return;
    }
    if (!newSourceUrl && !newSourceText) {
      toast.error('Please provide either a URL or text content');
      return;
    }

    setSources([...sources, {
      url: newSourceUrl || undefined,
      text: newSourceText || undefined,
      label: newSourceLabel
    }]);
    setNewSourceUrl('');
    setNewSourceText('');
    setNewSourceLabel('');
    toast.success('Source added');
  };

  const removeSource = (index: number) => {
    setSources(sources.filter((_, i) => i !== index));
  };

  const generateReport = async () => {
    if (!companyWebsite && sources.length === 0) {
      toast.error('Please provide at least a company website or additional sources');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-interview-research', {
        body: {
          interviewId,
          companyName,
          jobTitle,
          companyWebsite: companyWebsite || undefined,
          sources: sources.length > 0 ? sources : undefined
        }
      });

      if (error) throw error;

      setReport(data.report);
      toast.success('Research report generated successfully');
      onUpdate();
    } catch (error: any) {
      console.error('Research generation error:', error);
      if (error.message?.includes('Rate limit')) {
        toast.error('Rate limit exceeded. Please try again later.');
      } else if (error.message?.includes('credits')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Failed to generate research report');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const selectVersion = (versionIndex: number) => {
    setSelectedVersion(versionIndex);
    setReport(versions[versionIndex]?.report || null);
  };

  const printReport = () => {
    setIsPrintView(true);
    setTimeout(() => {
      window.print();
      setIsPrintView(false);
    }, 100);
  };

  if (isPrintView && report) {
    return (
      <div className="p-8 bg-background print:bg-white">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">{companyName} - Interview Research</h1>
          <p className="text-lg text-muted-foreground mb-1">{jobTitle}</p>
          <p className="text-sm text-muted-foreground mb-8">
            Generated: {format(new Date(report.generatedAt), 'PPP p')}
          </p>

          <Separator className="my-6" />

          {/* Overview */}
          {report.overview && (report.overview.mission || report.overview.values) && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Overview</h2>
              {report.overview.mission && (
                <div className="mb-3">
                  <h3 className="font-semibold mb-1">Mission</h3>
                  <p className="text-sm">{report.overview.mission}</p>
                  {report.overview.source && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Source: {report.overview.source}
                    </p>
                  )}
                </div>
              )}
              {report.overview.values && (
                <div>
                  <h3 className="font-semibold mb-1">Values</h3>
                  <p className="text-sm">{report.overview.values}</p>
                </div>
              )}
            </div>
          )}

          {/* Recent Developments */}
          {report.recentDevelopments && report.recentDevelopments.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Recent Developments</h2>
              {report.recentDevelopments.map((dev, idx) => (
                <div key={idx} className="mb-4">
                  <h3 className="font-semibold">{dev.title}</h3>
                  {dev.date && <p className="text-xs text-muted-foreground">{dev.date}</p>}
                  <p className="text-sm mt-1">{dev.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">Source: {dev.source}</p>
                </div>
              ))}
            </div>
          )}

          {/* Leadership */}
          {report.leadership && report.leadership.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Leadership</h2>
              {report.leadership.map((leader, idx) => (
                <div key={idx} className="mb-3">
                  <h3 className="font-semibold">{leader.name}</h3>
                  <p className="text-sm text-muted-foreground">{leader.title}</p>
                  {leader.bio && <p className="text-sm mt-1">{leader.bio}</p>}
                  <p className="text-xs text-muted-foreground mt-1">Source: {leader.source}</p>
                </div>
              ))}
            </div>
          )}

          {/* Competitive Landscape */}
          {report.competitiveLandscape && report.competitiveLandscape.content && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Competitive Landscape</h2>
              <p className="text-sm">{report.competitiveLandscape.content}</p>
              {report.competitiveLandscape.source ? (
                <p className="text-xs text-muted-foreground mt-1">
                  Source: {report.competitiveLandscape.source}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">Unverified (needs source)</p>
              )}
            </div>
          )}

          {/* Talking Points */}
          {report.talkingPoints && report.talkingPoints.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Talking Points</h2>
              <ul className="list-disc pl-5 space-y-2">
                {report.talkingPoints.map((point, idx) => (
                  <li key={idx} className="text-sm">{point}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions */}
          {report.questions && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Questions to Ask</h2>
              {report.questions.roleSpecific && report.questions.roleSpecific.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold mb-2">Role-Specific Questions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.questions.roleSpecific.map((q, idx) => (
                      <li key={idx} className="text-sm">{q}</li>
                    ))}
                  </ul>
                </div>
              )}
              {report.questions.companySpecific && report.questions.companySpecific.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Company-Specific Questions</h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {report.questions.companySpecific.map((q, idx) => (
                      <li key={idx} className="text-sm">{q}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Research Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Company Website (Optional)
            </label>
            <Input
              type="url"
              placeholder="https://company.com"
              value={companyWebsite}
              onChange={(e) => setCompanyWebsite(e.target.value)}
            />
          </div>

          <Separator />

          <div>
            <label className="text-sm font-medium mb-2 block">
              Additional Sources
            </label>
            <div className="space-y-3">
              {sources.map((source, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{source.label}</p>
                    {source.url && (
                      <a 
                        href={source.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        {source.url} <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {source.text && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {source.text}
                      </p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeSource(idx)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              <div className="space-y-2 p-3 border-2 border-dashed rounded-lg">
                <Input
                  placeholder="Source label (e.g., 'LinkedIn About Page')"
                  value={newSourceLabel}
                  onChange={(e) => setNewSourceLabel(e.target.value)}
                />
                <Input
                  type="url"
                  placeholder="Source URL (optional)"
                  value={newSourceUrl}
                  onChange={(e) => setNewSourceUrl(e.target.value)}
                />
                <Textarea
                  placeholder="Or paste text content..."
                  value={newSourceText}
                  onChange={(e) => setNewSourceText(e.target.value)}
                  rows={3}
                />
                <Button onClick={addSource} size="sm" variant="outline" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Source
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-2 p-3 bg-muted rounded-lg">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground">
              All information in the report will be cited from your provided sources. 
              Claims without sources will be marked as "Unverified (needs source)".
            </p>
          </div>

          <Button
            onClick={generateReport}
            disabled={isGenerating || (!companyWebsite && sources.length === 0)}
            className="w-full"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating Report...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Version History */}
      {versions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <History className="h-4 w-4" />
              Version History ({versions.length}/3)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedVersion.toString()} onValueChange={(v) => selectVersion(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version: any, idx: number) => (
                  <SelectItem key={idx} value={idx.toString()}>
                    Version {versions.length - idx} - {format(new Date(version.generatedAt), 'PPp')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Report Display */}
      {report && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Research Report
              </CardTitle>
              <Button onClick={printReport} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Print / Export
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Generated: {format(new Date(report.generatedAt), 'PPP p')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Overview */}
            {report.overview && (report.overview.mission || report.overview.values) && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Overview
                </h3>
                <div className="space-y-3 pl-6">
                  {report.overview.mission && (
                    <div>
                      <p className="text-sm font-medium mb-1">Mission</p>
                      <p className="text-sm text-muted-foreground">{report.overview.mission}</p>
                      {report.overview.source ? (
                        <a 
                          href={report.overview.source} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-1"
                        >
                          Source <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <Badge variant="outline" className="mt-1 text-xs">
                          Unverified (needs source)
                        </Badge>
                      )}
                    </div>
                  )}
                  {report.overview.values && (
                    <div>
                      <p className="text-sm font-medium mb-1">Values</p>
                      <p className="text-sm text-muted-foreground">{report.overview.values}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Recent Developments */}
            {report.recentDevelopments && report.recentDevelopments.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recent Developments
                </h3>
                <div className="space-y-3 pl-6">
                  {report.recentDevelopments.map((dev, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">{dev.title}</h4>
                      {dev.date && (
                        <p className="text-xs text-muted-foreground">{dev.date}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{dev.summary}</p>
                      <a 
                        href={dev.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Leadership */}
            {report.leadership && report.leadership.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Leadership
                </h3>
                <div className="space-y-3 pl-6">
                  {report.leadership.map((leader, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <h4 className="font-medium text-sm">{leader.name}</h4>
                      <p className="text-xs text-muted-foreground">{leader.title}</p>
                      {leader.bio && (
                        <p className="text-sm text-muted-foreground mt-1">{leader.bio}</p>
                      )}
                      <a 
                        href={leader.source} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                      >
                        Source <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Competitive Landscape */}
            {report.competitiveLandscape && report.competitiveLandscape.content && (
              <div>
                <h3 className="font-semibold mb-3">Competitive Landscape</h3>
                <div className="pl-6">
                  <p className="text-sm text-muted-foreground">{report.competitiveLandscape.content}</p>
                  {report.competitiveLandscape.source ? (
                    <a 
                      href={report.competitiveLandscape.source} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline flex items-center gap-1 mt-2"
                    >
                      Source <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <Badge variant="outline" className="mt-2 text-xs">
                      Unverified (needs source)
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <Separator />

            {/* Talking Points */}
            {report.talkingPoints && report.talkingPoints.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Talking Points</h3>
                <ul className="space-y-2 pl-6">
                  {report.talkingPoints.map((point, idx) => (
                    <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />

            {/* Questions to Ask */}
            {report.questions && (
              <div>
                <h3 className="font-semibold mb-3">Intelligent Questions to Ask</h3>
                <div className="space-y-4 pl-6">
                  {report.questions.roleSpecific && report.questions.roleSpecific.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Role-Specific Questions</p>
                      <ul className="space-y-2">
                        {report.questions.roleSpecific.map((q, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {report.questions.companySpecific && report.questions.companySpecific.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Company-Specific Questions</p>
                      <ul className="space-y-2">
                        {report.questions.companySpecific.map((q, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};