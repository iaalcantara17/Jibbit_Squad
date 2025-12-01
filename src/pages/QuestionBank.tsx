import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Brain, 
  Filter, 
  Search, 
  BookOpen,
  Target,
  TrendingUp,
  Code,
  Users,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { QuestionDetailDrawer } from '@/components/interviews/QuestionDetailDrawer';

interface QuestionBankItem {
  id: string;
  role_title: string;
  industry: string | null;
  category: 'behavioral' | 'technical' | 'situational';
  difficulty: 'entry' | 'mid' | 'senior';
  question_text: string;
  star_framework_hint: string | null;
  linked_skills: string[];
  source: string | null;
}

const QuestionBank = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuestionBankItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [skillFilter, setSkillFilter] = useState<string>('');

  // Get unique values for filters
  const uniqueRoles = Array.from(new Set(questions.map(q => q.role_title))).sort();
  const uniqueIndustries = Array.from(new Set(questions.map(q => q.industry).filter(Boolean))).sort();

  useEffect(() => {
    loadQuestions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [questions, searchQuery, roleFilter, industryFilter, categoryFilter, difficultyFilter, skillFilter]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('question_bank_items')
        .select('*')
        .order('role_title', { ascending: true })
        .order('difficulty', { ascending: true });

      if (error) throw error;
      setQuestions((data || []) as QuestionBankItem[]);
    } catch (error) {
      console.error('Error loading questions:', error);
      toast.error('Failed to load question bank');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...questions];

    // Search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q => 
        q.question_text.toLowerCase().includes(query) ||
        q.linked_skills.some(skill => skill.toLowerCase().includes(query))
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(q => q.role_title === roleFilter);
    }

    // Industry filter
    if (industryFilter !== 'all') {
      filtered = filtered.filter(q => q.industry === industryFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(q => q.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(q => q.difficulty === difficultyFilter);
    }

    // Skill filter
    if (skillFilter) {
      const skillQuery = skillFilter.toLowerCase();
      filtered = filtered.filter(q => 
        q.linked_skills.some(skill => skill.toLowerCase().includes(skillQuery))
      );
    }

    setFilteredQuestions(filtered);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setIndustryFilter('all');
    setCategoryFilter('all');
    setDifficultyFilter('all');
    setSkillFilter('');
  };

  const openQuestionDetail = (question: QuestionBankItem) => {
    setSelectedQuestion(question);
    setDrawerOpen(true);
  };

  const startPractice = (questionId: string) => {
    navigate(`/question-practice/${questionId}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'behavioral':
        return <Users className="h-4 w-4" />;
      case 'technical':
        return <Code className="h-4 w-4" />;
      case 'situational':
        return <Target className="h-4 w-4" />;
      default:
        return <Brain className="h-4 w-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'entry':
        return 'default';
      case 'mid':
        return 'secondary';
      case 'senior':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Interview Question Bank
            </h1>
            <p className="text-muted-foreground">
              Browse and practice interview questions by role, industry, and difficulty
            </p>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search questions or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filter selects */}
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {uniqueRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Industry</label>
                  <Select value={industryFilter} onValueChange={setIndustryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Industries</SelectItem>
                      {uniqueIndustries.map(industry => (
                        <SelectItem key={industry} value={industry!}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="behavioral">Behavioral</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="situational">Situational</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Skill</label>
                  <Input
                    placeholder="Filter by skill..."
                    value={skillFilter}
                    onChange={(e) => setSkillFilter(e.target.value)}
                  />
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters} className="w-full">
                    Reset Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {filteredQuestions.length} of {questions.length} questions
            </p>
          </div>

          {/* Questions grid */}
          {filteredQuestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No questions found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredQuestions.map((question) => (
                <Card 
                  key={question.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => openQuestionDetail(question)}
                >
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      {/* Question header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="font-medium mb-2">{question.question_text}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="font-medium">{question.role_title}</span>
                            {question.industry && (
                              <>
                                <span>•</span>
                                <span>{question.industry}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getCategoryIcon(question.category)}
                            {question.category}
                          </Badge>
                          <Badge variant={getDifficultyColor(question.difficulty)}>
                            {question.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Skills */}
                      {question.linked_skills.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {question.linked_skills.map((skill, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Question detail drawer */}
      {selectedQuestion && (
        <QuestionDetailDrawer
          question={selectedQuestion}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onUpdate={loadQuestions}
          onStartPractice={startPractice}
        />
      )}
    </div>
  );
};

export default QuestionBank;