import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Award, 
  Plus, 
  ExternalLink, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Code,
  BookOpen,
  Trophy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ExternalCertification {
  id: string;
  platform: string;
  certification_name: string;
  certification_url: string | null;
  badge_url: string | null;
  score: string | null;
  rank: string | null;
  is_verified: boolean;
  created_at: string;
}

const PLATFORMS = [
  { id: 'hackerrank', name: 'HackerRank', icon: Code, color: 'bg-green-500' },
  { id: 'leetcode', name: 'LeetCode', icon: Code, color: 'bg-yellow-500' },
  { id: 'codecademy', name: 'Codecademy', icon: BookOpen, color: 'bg-purple-500' },
  { id: 'coursera', name: 'Coursera', icon: Award, color: 'bg-blue-500' },
  { id: 'udemy', name: 'Udemy', icon: BookOpen, color: 'bg-pink-500' },
  { id: 'linkedin_learning', name: 'LinkedIn Learning', icon: Award, color: 'bg-sky-500' },
  { id: 'pluralsight', name: 'Pluralsight', icon: BookOpen, color: 'bg-red-500' },
  { id: 'aws', name: 'AWS Certifications', icon: Trophy, color: 'bg-orange-500' },
  { id: 'google', name: 'Google Certifications', icon: Trophy, color: 'bg-blue-600' },
  { id: 'microsoft', name: 'Microsoft Certifications', icon: Trophy, color: 'bg-cyan-500' },
];

export const ExternalCertificationsManager = () => {
  const { user } = useAuth();
  const [certifications, setCertifications] = useState<ExternalCertification[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  const [newCert, setNewCert] = useState({
    platform: '',
    certification_name: '',
    certification_url: '',
    score: '',
    rank: ''
  });

  useEffect(() => {
    if (user) {
      fetchCertifications();
    }
  }, [user]);

  const fetchCertifications = async () => {
    try {
      const { data, error } = await supabase
        .from('external_certifications')
        .select('*')
        .eq('user_id', user?.id)
        .neq('platform', 'github') // Exclude GitHub repos (handled separately)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Map database fields to component interface
      const mappedData: ExternalCertification[] = (data || []).map(item => ({
        id: item.id,
        platform: item.platform,
        certification_name: item.certification_name,
        certification_url: item.certification_url,
        badge_url: item.badge_url,
        score: item.score,
        rank: item.rank,
        is_verified: item.is_verified,
        created_at: item.created_at
      }));
      
      setCertifications(mappedData);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast.error('Failed to load certifications');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCertification = async () => {
    if (!newCert.platform || !newCert.certification_name) {
      toast.error('Please fill in required fields');
      return;
    }

    try {
      const { error } = await supabase.from('external_certifications').insert({
        user_id: user?.id,
        platform: newCert.platform,
        certification_name: newCert.certification_name,
        certification_url: newCert.certification_url || null,
        score: newCert.score || null,
        rank: newCert.rank || null,
        is_verified: !!newCert.certification_url
      });

      if (error) throw error;

      toast.success('Certification added successfully');
      setIsAddDialogOpen(false);
      setNewCert({
        platform: '',
        certification_name: '',
        certification_url: '',
        score: '',
        rank: ''
      });
      fetchCertifications();
    } catch (error) {
      console.error('Error adding certification:', error);
      toast.error('Failed to add certification');
    }
  };

  const handleDeleteCertification = async (id: string) => {
    try {
      const { error } = await supabase
        .from('external_certifications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Certification removed');
      fetchCertifications();
    } catch (error) {
      console.error('Error deleting certification:', error);
      toast.error('Failed to remove certification');
    }
  };

  const syncWithPlatform = async (platform: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('external-skills', {
        body: { platform, action: 'sync' }
      });

      if (error) throw error;

      if (data?.certifications) {
        toast.success(`Synced ${data.certifications.length} certifications from ${platform}`);
        fetchCertifications();
      } else {
        toast.info('No new certifications found');
      }
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Failed to sync. Manual entry is available.');
    } finally {
      setSyncing(false);
    }
  };

  const getPlatformInfo = (platformId: string) => {
    return PLATFORMS.find(p => p.id === platformId) || {
      id: platformId,
      name: platformId,
      icon: Award,
      color: 'bg-gray-500'
    };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                External Certifications & Assessments
              </CardTitle>
              <CardDescription>
                Link your certifications from HackerRank, LeetCode, Coursera, and more
              </CardDescription>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Certification
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add External Certification</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Platform *</Label>
                    <Select
                      value={newCert.platform}
                      onValueChange={(value) => setNewCert({ ...newCert, platform: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLATFORMS.map((platform) => (
                          <SelectItem key={platform.id} value={platform.id}>
                            <div className="flex items-center gap-2">
                              <platform.icon className="h-4 w-4" />
                              {platform.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Certification/Course Name *</Label>
                    <Input
                      placeholder="e.g., Python (Basic), React Developer, AWS Solutions Architect"
                      value={newCert.certification_name}
                      onChange={(e) => setNewCert({ ...newCert, certification_name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Verification URL</Label>
                    <Input
                      type="url"
                      placeholder="https://www.hackerrank.com/certificates/..."
                      value={newCert.certification_url}
                      onChange={(e) => setNewCert({ ...newCert, certification_url: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Score (if applicable)</Label>
                      <Input
                        placeholder="e.g., 95"
                        value={newCert.score}
                        onChange={(e) => setNewCert({ ...newCert, score: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Rank/Level</Label>
                      <Input
                        placeholder="e.g., Gold, 5 Star"
                        value={newCert.rank}
                        onChange={(e) => setNewCert({ ...newCert, rank: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCertification}>
                      Add Certification
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {/* Quick Sync Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            {PLATFORMS.slice(0, 5).map((platform) => (
              <Button
                key={platform.id}
                variant="outline"
                size="sm"
                onClick={() => syncWithPlatform(platform.id)}
                disabled={syncing}
              >
                {syncing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <platform.icon className="h-4 w-4 mr-2" />
                )}
                Sync {platform.name}
              </Button>
            ))}
          </div>

          {/* Certifications List */}
          {certifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No external certifications added yet</p>
              <p className="text-sm">Add your HackerRank, LeetCode, or other certifications to showcase your skills</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {certifications.map((cert) => {
                const platform = getPlatformInfo(cert.platform);
                const PlatformIcon = platform.icon;
                
                return (
                  <div
                    key={cert.id}
                    className="p-4 border rounded-lg hover:border-muted-foreground/50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${platform.color} text-white`}>
                          <PlatformIcon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-medium">{cert.certification_name}</div>
                          <div className="text-sm text-muted-foreground">{platform.name}</div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCertification(cert.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      {cert.is_verified ? (
                        <Badge variant="default" className="bg-green-500">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Unverified
                        </Badge>
                      )}
                      
                      {cert.score && (
                        <Badge variant="outline">Score: {cert.score}</Badge>
                      )}
                      
                      {cert.rank && (
                        <Badge variant="outline">{cert.rank}</Badge>
                      )}
                    </div>

                    {cert.certification_url && (
                      <Button
                        variant="link"
                        size="sm"
                        className="p-0 h-auto mt-2"
                        onClick={() => window.open(cert.certification_url!, '_blank')}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View Certificate
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
