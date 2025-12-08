import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Tag, 
  Star, 
  StarOff,
  Trash2,
  Edit,
  Copy,
  MessageSquare,
  Play,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InterviewResponse {
  id: string;
  question_type: string;
  question_text: string;
  response_text: string;
  tags: unknown;
  skills_demonstrated: unknown;
  companies_used_for: unknown;
  is_starred: boolean;
  created_at: string;
  updated_at: string;
  success_count: number;
  ai_feedback: string | null;
  ai_feedback_score: number | null;
  experiences_referenced: unknown;
  version: number;
}

// Helper to safely get array from Json
const asStringArray = (val: unknown): string[] => {
  if (Array.isArray(val)) return val.filter((v): v is string => typeof v === 'string');
  return [];
};

const QUESTION_TYPES = [
  'Behavioral',
  'Technical',
  'Situational',
  'Experience-based',
  'Problem-solving',
  'Culture fit',
  'Leadership',
  'Teamwork'
];

export default function InterviewResponseLibrary() {
  const { user } = useAuth();
  const [responses, setResponses] = useState<InterviewResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingResponse, setEditingResponse] = useState<InterviewResponse | null>(null);
  const [practiceMode, setPracticeMode] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);

  const [formData, setFormData] = useState({
    question_text: '',
    response_text: '',
    question_type: 'Behavioral',
    tags: '',
    skills: ''
  });

  const fetchResponses = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('interview_response_library')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error('Failed to fetch responses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResponses();
  }, [user]);

  const handleSave = async () => {
    if (!user || !formData.question_text || !formData.response_text) {
      toast.error('Question and response are required');
      return;
    }

    try {
      const responseData = {
        user_id: user.id,
        question_text: formData.question_text,
        response_text: formData.response_text,
        question_type: formData.question_type,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        companies_used: [],
        success_count: 0
      };

      if (editingResponse) {
        const { error } = await supabase
          .from('interview_response_library')
          .update(responseData)
          .eq('id', editingResponse.id);

        if (error) throw error;
        toast.success('Response updated');
      } else {
        const { error } = await supabase
          .from('interview_response_library')
          .insert(responseData);

        if (error) throw error;
        toast.success('Response added');
      }

      setShowAddDialog(false);
      setEditingResponse(null);
      setFormData({ question_text: '', response_text: '', question_type: 'Behavioral', tags: '', skills: '' });
      fetchResponses();
    } catch (err) {
      toast.error('Failed to save response');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('interview_response_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Response deleted');
      fetchResponses();
    } catch (err) {
      toast.error('Failed to delete response');
    }
  };

  const handleMarkSuccess = async (id: string) => {
    const response = responses.find(r => r.id === id);
    if (!response) return;

    try {
      const { error } = await supabase
        .from('interview_response_library')
        .update({ success_count: (response.success_count || 0) + 1 })
        .eq('id', id);

      if (error) throw error;
      toast.success('Marked as successful');
      fetchResponses();
    } catch (err) {
      toast.error('Failed to update');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const exportLibrary = () => {
    const content = responses.map(r => 
      `## ${r.question_type}: ${r.question_text}\n\n${r.response_text}\n\nTags: ${asStringArray(r.tags).join(', ') || 'None'}\n\n---\n`
    ).join('\n');
    
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'interview-responses.md';
    a.click();
  };

  const filteredResponses = responses.filter(r => {
    const tagsArr = asStringArray(r.tags);
    const matchesSearch = searchQuery === '' || 
      r.question_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.response_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tagsArr.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || r.question_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const responsesByType = QUESTION_TYPES.reduce((acc, type) => {
    acc[type] = responses.filter(r => r.question_type === type).length;
    return acc;
  }, {} as Record<string, number>);

  const practiceResponses = filteredResponses.length > 0 ? filteredResponses : responses;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-3">
                <BookOpen className="h-10 w-10 text-primary" />
                Interview Response Library
              </h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Build and refine your best interview answers
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportLibrary}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" onClick={() => setPracticeMode(!practiceMode)}>
                <Play className="h-4 w-4 mr-2" />
                Practice Mode
              </Button>
              <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Response
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingResponse ? 'Edit Response' : 'Add New Response'}</DialogTitle>
                    <DialogDescription>
                      Store your best interview answers for future reference
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Question Type</Label>
                      <Select 
                        value={formData.question_type} 
                        onValueChange={(v) => setFormData({...formData, question_type: v})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {QUESTION_TYPES.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Question</Label>
                      <Textarea 
                        placeholder="e.g., Tell me about a time you handled conflict..."
                        value={formData.question_text}
                        onChange={(e) => setFormData({...formData, question_text: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Your Response</Label>
                      <Textarea 
                        placeholder="Your prepared answer..."
                        className="min-h-[150px]"
                        value={formData.response_text}
                        onChange={(e) => setFormData({...formData, response_text: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Tags (comma separated)</Label>
                        <Input 
                          placeholder="conflict, teamwork, leadership"
                          value={formData.tags}
                          onChange={(e) => setFormData({...formData, tags: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Skills (comma separated)</Label>
                        <Input 
                          placeholder="communication, problem-solving"
                          value={formData.skills}
                          onChange={(e) => setFormData({...formData, skills: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
                    <Button onClick={handleSave}>Save Response</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Practice Mode */}
          {practiceMode && practiceResponses.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-5 w-5 text-primary" />
                  Practice Mode
                </CardTitle>
                <CardDescription>
                  Question {currentPracticeIndex + 1} of {practiceResponses.length}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <Badge variant="secondary" className="mb-2">
                    {practiceResponses[currentPracticeIndex].question_type}
                  </Badge>
                  <p className="text-lg font-medium">
                    {practiceResponses[currentPracticeIndex].question_text}
                  </p>
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-primary font-medium">
                    Click to reveal suggested answer
                  </summary>
                  <div className="mt-3 p-4 border rounded-lg">
                    <p className="whitespace-pre-wrap">
                      {practiceResponses[currentPracticeIndex].response_text}
                    </p>
                  </div>
                </details>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setCurrentPracticeIndex(Math.max(0, currentPracticeIndex - 1))}
                    disabled={currentPracticeIndex === 0}
                  >
                    Previous
                  </Button>
                  <Button 
                    onClick={() => setCurrentPracticeIndex(Math.min(practiceResponses.length - 1, currentPracticeIndex + 1))}
                    disabled={currentPracticeIndex === practiceResponses.length - 1}
                  >
                    Next Question
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{responses.length}</p>
                <p className="text-sm text-muted-foreground">Total Responses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{new Set(responses.map(r => r.question_type)).size}</p>
                <p className="text-sm text-muted-foreground">Question Types</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{responses.reduce((sum, r) => sum + (r.success_count || 0), 0)}</p>
                <p className="text-sm text-muted-foreground">Successful Uses</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-3xl font-bold">{responses.filter(r => asStringArray(r.tags).length > 0).length}</p>
                <p className="text-sm text-muted-foreground">Tagged Responses</p>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search questions, responses, or tags..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {QUESTION_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type} ({responsesByType[type] || 0})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responses List */}
          <div className="space-y-4">
            {filteredResponses.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    {responses.length === 0 
                      ? 'No responses yet. Start building your library!' 
                      : 'No responses match your search.'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredResponses.map(response => (
                <Card key={response.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{response.question_type}</Badge>
                          {response.success_count > 0 && (
                            <Badge variant="outline" className="text-success">
                              <Star className="h-3 w-3 mr-1 fill-current" />
                              {response.success_count} wins
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg">{response.question_text}</CardTitle>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleMarkSuccess(response.id)}>
                          <Star className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => copyToClipboard(response.response_text)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            setEditingResponse(response);
                            setFormData({
                              question_text: response.question_text,
                              response_text: response.response_text,
                              question_type: response.question_type,
                              tags: asStringArray(response.tags).join(', '),
                              skills: asStringArray(response.skills_demonstrated).join(', ')
                            });
                            setShowAddDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(response.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground whitespace-pre-wrap line-clamp-4">
                      {response.response_text}
                    </p>
                    {asStringArray(response.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {asStringArray(response.tags).map((tag, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            <Tag className="h-3 w-3 mr-1" />
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
