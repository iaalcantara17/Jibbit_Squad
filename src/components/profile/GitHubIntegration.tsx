import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Github, Star, GitFork, RefreshCw, ExternalLink, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Repository {
  id: number;
  name: string;
  description: string | null;
  html_url: string;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  topics: string[];
}

interface GitHubProfile {
  login: string;
  avatar_url: string;
  public_repos: number;
  followers: number;
  following: number;
}

export const GitHubIntegration = () => {
  const { user } = useAuth();
  const [githubUsername, setGithubUsername] = useState('');
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [featuredRepos, setFeaturedRepos] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    loadSavedData();
  }, [user]);

  const loadSavedData = async () => {
    if (!user) return;
    
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('github_url')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileData?.github_url) {
        const username = profileData.github_url.replace('https://github.com/', '');
        setGithubUsername(username);
        if (username) {
          await fetchGitHubData(username);
        }
      }

      // Load featured repos from external_certifications
      const { data: certs } = await supabase
        .from('external_certifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('platform', 'github');

      if (certs && certs.length > 0) {
        setFeaturedRepos(certs.map(c => c.certification_name || ''));
      }
    } catch (error) {
      console.error('Error loading GitHub data:', error);
    }
  };

  const fetchGitHubData = async (username: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('github-integration', {
        body: { username }
      });

      if (error) throw error;

      if (data?.profile) {
        setProfile(data.profile);
        setConnected(true);
      }
      if (data?.repositories) {
        setRepositories(data.repositories);
      }
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      toast.error('Failed to fetch GitHub data. Please check the username.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!githubUsername.trim()) {
      toast.error('Please enter a GitHub username');
      return;
    }

    await fetchGitHubData(githubUsername.trim());
    
    // Save to profile
    if (user) {
      await supabase
        .from('profiles')
        .update({ github_url: `https://github.com/${githubUsername.trim()}` })
        .eq('user_id', user.id);
    }
  };

  const toggleFeaturedRepo = async (repoName: string) => {
    if (!user) return;

    const newFeatured = featuredRepos.includes(repoName)
      ? featuredRepos.filter(r => r !== repoName)
      : [...featuredRepos, repoName].slice(0, 6); // Max 6 featured repos

    setFeaturedRepos(newFeatured);

    // Save to database
    try {
      // Delete existing
      await supabase
        .from('external_certifications')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', 'github');

      // Insert new
      if (newFeatured.length > 0) {
        const repo = repositories.find(r => r.name === repoName);
        await supabase.from('external_certifications').insert(
          newFeatured.map(name => ({
            user_id: user.id,
            platform: 'github',
            certification_name: name,
            certification_url: `https://github.com/${githubUsername}/${name}`,
            is_verified: true
          }))
        );
      }

      toast.success('Featured repositories updated');
    } catch (error) {
      console.error('Error saving featured repos:', error);
      toast.error('Failed to save featured repositories');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Github className="h-5 w-5" />
            GitHub Integration
          </CardTitle>
          <CardDescription>
            Connect your GitHub account to showcase your projects and contributions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="github-username">GitHub Username</Label>
              <Input
                id="github-username"
                placeholder="e.g., octocat"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleConnect} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : connected ? (
                  <RefreshCw className="h-4 w-4 mr-2" />
                ) : (
                  <Github className="h-4 w-4 mr-2" />
                )}
                {connected ? 'Refresh' : 'Connect'}
              </Button>
            </div>
          </div>

          {profile && (
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <img
                src={profile.avatar_url}
                alt={profile.login}
                className="w-12 h-12 rounded-full"
              />
              <div className="flex-1">
                <div className="font-medium">{profile.login}</div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{profile.public_repos} repos</span>
                  <span>{profile.followers} followers</span>
                  <span>{profile.following} following</span>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://github.com/${profile.login}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Profile
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {repositories.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Your Repositories</CardTitle>
            <CardDescription>
              Select up to 6 repositories to feature on your profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {repositories.map((repo) => (
                <div
                  key={repo.id}
                  className={`p-4 border rounded-lg transition-colors ${
                    featuredRepos.includes(repo.name)
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={featuredRepos.includes(repo.name)}
                        onCheckedChange={() => toggleFeaturedRepo(repo.name)}
                        disabled={
                          !featuredRepos.includes(repo.name) && featuredRepos.length >= 6
                        }
                      />
                      <a
                        href={repo.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {repo.name}
                      </a>
                    </div>
                    {repo.language && (
                      <Badge variant="secondary">{repo.language}</Badge>
                    )}
                  </div>
                  
                  {repo.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {repo.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" />
                      {repo.forks_count}
                    </span>
                    <span>Updated {formatDate(repo.updated_at)}</span>
                  </div>

                  {repo.topics && repo.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {repo.topics.slice(0, 4).map((topic) => (
                        <Badge key={topic} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {featuredRepos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Featured Repositories</CardTitle>
            <CardDescription>
              These repositories will be displayed on your public profile
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {featuredRepos.map((repoName) => {
                const repo = repositories.find(r => r.name === repoName);
                return (
                  <Badge key={repoName} variant="default" className="py-1 px-3">
                    <Github className="h-3 w-3 mr-1" />
                    {repoName}
                    {repo && (
                      <span className="ml-2 opacity-70">
                        <Star className="h-3 w-3 inline mr-0.5" />
                        {repo.stargazers_count}
                      </span>
                    )}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
