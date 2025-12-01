import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Code2, Search, Filter, Clock, CheckCircle2, Loader2 } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  difficulty: string;
  category: string;
  tech_stack: string[];
}

export default function TechnicalPrep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [filteredChallenges, setFilteredChallenges] = useState<Challenge[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [userTechStack, setUserTechStack] = useState<string[]>([]);
  const [attemptCounts, setAttemptCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    loadChallenges();
    loadUserTechStack();
    loadAttemptCounts();
  }, [user]);

  useEffect(() => {
    filterChallenges();
  }, [challenges, searchQuery, categoryFilter, difficultyFilter]);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('technical_challenges')
        .select('*')
        .order('category')
        .order('difficulty');

      if (error) throw error;
      setChallenges(data || []);
      setFilteredChallenges(data || []);
    } catch (error) {
      console.error('Error loading challenges:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserTechStack = async () => {
    if (!user) return;

    try {
      const { data: jobs } = await supabase
        .from('jobs')
        .select('job_description')
        .eq('user_id', user.id)
        .not('job_description', 'is', null)
        .limit(10);

      if (jobs) {
        const techKeywords = ['javascript', 'typescript', 'python', 'java', 'react', 'node', 'sql', 'aws', 'docker'];
        const foundTech = new Set<string>();
        
        jobs.forEach(job => {
          const desc = job.job_description?.toLowerCase() || '';
          techKeywords.forEach(keyword => {
            if (desc.includes(keyword)) {
              foundTech.add(keyword);
            }
          });
        });

        setUserTechStack(Array.from(foundTech));
      }
    } catch (error) {
      console.error('Error loading tech stack:', error);
    }
  };

  const loadAttemptCounts = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('technical_practice_attempts')
        .select('challenge_id')
        .eq('user_id', user.id);

      if (data) {
        const counts: Record<string, number> = {};
        data.forEach(attempt => {
          counts[attempt.challenge_id] = (counts[attempt.challenge_id] || 0) + 1;
        });
        setAttemptCounts(counts);
      }
    } catch (error) {
      console.error('Error loading attempt counts:', error);
    }
  };

  const filterChallenges = () => {
    let filtered = [...challenges];

    if (searchQuery) {
      filtered = filtered.filter(c => 
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(c => c.category === categoryFilter);
    }

    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(c => c.difficulty === difficultyFilter);
    }

    setFilteredChallenges(filtered);
  };

  const categories = Array.from(new Set(challenges.map(c => c.category)));

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'medium': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return '';
    }
  };

  const isRecommended = (challenge: Challenge) => {
    return challenge.tech_stack.some(tech => 
      userTechStack.includes(tech.toLowerCase())
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-3">
              <Code2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-display font-bold">Technical Prep</h1>
              <p className="text-muted-foreground mt-1">
                Practice coding challenges and track your solutions
              </p>
            </div>
          </div>

          {/* Important Notice */}
          <Card className="border-yellow-500/20 bg-yellow-500/5">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This is a practice environment for writing and organizing solutions. 
                Code is not executed or automatically graded. Use the rubric checklist to self-evaluate your solutions.
              </p>
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filter Challenges</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search challenges..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-full sm:w-[150px]">
                    <SelectValue placeholder="Difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {userTechStack.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-sm text-muted-foreground">Your tech stack:</span>
                  {userTechStack.map(tech => (
                    <Badge key={tech} variant="secondary" className="capitalize">
                      {tech}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Challenges List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredChallenges.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No challenges found matching your filters</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredChallenges.map((challenge) => (
                <Card 
                  key={challenge.id} 
                  className={`hover:border-primary/50 transition-colors cursor-pointer ${
                    isRecommended(challenge) ? 'border-primary/30 bg-primary/5' : ''
                  }`}
                  onClick={() => navigate(`/technical-prep/${challenge.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-2 truncate">
                          {challenge.title}
                        </CardTitle>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className={getDifficultyColor(challenge.difficulty)}>
                            {challenge.difficulty}
                          </Badge>
                          <Badge variant="outline" className="capitalize">
                            {challenge.category}
                          </Badge>
                          {isRecommended(challenge) && (
                            <Badge variant="default" className="bg-primary/20 text-primary border-primary/30">
                              Recommended
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {attemptCounts[challenge.id] ? (
                          <div className="flex items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-primary" />
                            <span>{attemptCounts[challenge.id]} attempt{attemptCounts[challenge.id] > 1 ? 's' : ''}</span>
                          </div>
                        ) : (
                          <span>Not attempted</span>
                        )}
                      </div>
                      <Button size="sm" variant="ghost">
                        Start →
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}