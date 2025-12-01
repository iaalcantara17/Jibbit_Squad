import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useState } from 'react';

export const InstitutionalSettings = () => {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    institution_name: '',
    logo_url: '',
    primary_color: '#000000',
    secondary_color: '#ffffff',
    custom_domain: '',
  });

  const { data: existingSettings } = useQuery({
    queryKey: ['institutional-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('institutional_settings')
        .select('*')
        .single();
      if (error && error.code !== 'PGRST116') throw error;
      if (data) {
        setSettings({
          institution_name: data.institution_name || '',
          logo_url: data.logo_url || '',
          primary_color: data.primary_color || '#000000',
          secondary_color: data.secondary_color || '#ffffff',
          custom_domain: data.custom_domain || '',
        });
      }
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (existingSettings) {
        const { error } = await supabase
          .from('institutional_settings')
          .update(settings)
          .eq('id', existingSettings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('institutional_settings')
          .insert({ ...settings, created_by: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['institutional-settings'] });
      toast.success('Settings saved successfully!');
    },
    onError: (error: any) => {
      toast.error('Failed to save settings: ' + error.message);
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>White-Label Branding</CardTitle>
          <CardDescription>
            Customize the platform appearance for your institution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="institution">Institution Name</Label>
            <Input
              id="institution"
              value={settings.institution_name}
              onChange={(e) => setSettings({ ...settings, institution_name: e.target.value })}
              placeholder="University Name or Company Name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={settings.logo_url}
              onChange={(e) => setSettings({ ...settings, logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="primary">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary"
                  type="color"
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  value={settings.primary_color}
                  onChange={(e) => setSettings({ ...settings, primary_color: e.target.value })}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary"
                  type="color"
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  className="h-10 w-20"
                />
                <Input
                  value={settings.secondary_color}
                  onChange={(e) => setSettings({ ...settings, secondary_color: e.target.value })}
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="domain">Custom Domain (Optional)</Label>
            <Input
              id="domain"
              value={settings.custom_domain}
              onChange={(e) => setSettings({ ...settings, custom_domain: e.target.value })}
              placeholder="careers.university.edu"
            />
          </div>
          <Button onClick={() => saveMutation.mutate()}>
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
