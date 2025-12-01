import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useState } from 'react';

export const AdvisorProfile = () => {
  const queryClient = useQueryClient();
  const [profile, setProfile] = useState({
    display_name: '',
    bio: '',
    specialization: '',
    hourly_rate: '',
    is_active: true,
  });

  const { data: existingProfile } = useQuery({
    queryKey: ['my-advisor-profile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('advisor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setProfile({
          display_name: data.display_name || '',
          bio: data.bio || '',
          specialization: data.specialization?.join(', ') || '',
          hourly_rate: data.hourly_rate?.toString() || '',
          is_active: data.is_active,
        });
      }
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const specializationArray = profile.specialization
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const profileData = {
        user_id: user.id,
        display_name: profile.display_name,
        bio: profile.bio,
        specialization: specializationArray,
        hourly_rate: profile.hourly_rate ? parseFloat(profile.hourly_rate) : null,
        is_active: profile.is_active,
      };

      if (existingProfile) {
        const { error } = await supabase
          .from('advisor_profiles')
          .update(profileData)
          .eq('id', existingProfile.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('advisor_profiles')
          .insert(profileData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-advisor-profile'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-profiles'] });
      toast.success('Advisor profile saved successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to save profile: ' + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Become an Advisor</CardTitle>
          <CardDescription>
            Set up your coaching profile and start offering sessions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Display Name</Label>
            <Input
              id="displayName"
              value={profile.display_name}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Your professional name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={profile.bio}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              placeholder="Share your background and expertise"
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="specialization">Specializations</Label>
            <Input
              id="specialization"
              value={profile.specialization}
              onChange={(e) => setProfile({ ...profile, specialization: e.target.value })}
              placeholder="Resume Review, Interview Prep, Career Strategy (comma-separated)"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate (USD)</Label>
            <Input
              id="hourlyRate"
              type="number"
              value={profile.hourly_rate}
              onChange={(e) => setProfile({ ...profile, hourly_rate: e.target.value })}
              placeholder="50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              id="active"
              checked={profile.is_active}
              onCheckedChange={(checked) => setProfile({ ...profile, is_active: checked })}
            />
            <Label htmlFor="active" className="cursor-pointer">
              Accept new clients
            </Label>
          </div>
          <Button onClick={() => saveMutation.mutate()} disabled={!profile.display_name}>
            Save Profile
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
