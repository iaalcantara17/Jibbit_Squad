import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Target, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';

interface Campaign {
  id: string;
  name: string;
  target_companies: string[];
  target_roles: string[];
  goal?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

interface CampaignOutreach {
  id: string;
  campaign_id: string;
  contact_id: string;
  variant: 'A' | 'B';
  sent_at?: string;
  response_received: boolean;
  response_date?: string;
  contact: { name: string; company?: string };
}

const NetworkingCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [outreaches, setOutreaches] = useState<CampaignOutreach[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isOutreachFormOpen, setIsOutreachFormOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    target_companies: '',
    target_roles: '',
    goal: '',
    start_date: '',
    end_date: '',
  });

  const [outreachData, setOutreachData] = useState({
    contact_id: '',
    variant: 'A' as 'A' | 'B',
    sent_at: format(new Date(), 'yyyy-MM-dd'),
  });

  useEffect(() => {
    fetchCampaigns();
    fetchContacts();
  }, []);

  useEffect(() => {
    if (selectedCampaign) {
      fetchCampaignOutreaches(selectedCampaign.id);
    }
  }, [selectedCampaign]);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('networking_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
      if (data && data.length > 0) setSelectedCampaign(data[0]);
    } catch (error: any) {
      toast.error('Failed to load campaigns');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCampaignOutreaches = async (campaignId: string) => {
    try {
      const { data, error } = await supabase
        .from('campaign_outreaches')
        .select('*, contact:contacts(name, company)')
        .eq('campaign_id', campaignId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setOutreaches((data as any) || []);
    } catch (error: any) {
      toast.error('Failed to load outreaches');
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, company')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast.error('Failed to load contacts');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const campaignData = {
        user_id: user.id,
        name: formData.name,
        target_companies: formData.target_companies.split(',').map(c => c.trim()).filter(Boolean),
        target_roles: formData.target_roles.split(',').map(r => r.trim()).filter(Boolean),
        goal: formData.goal || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
      };

      const { data, error } = await supabase
        .from('networking_campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Campaign created');
      setIsFormOpen(false);
      resetForm();
      fetchCampaigns();
      setSelectedCampaign(data);
    } catch (error: any) {
      toast.error('Failed to create campaign', { description: error.message });
    }
  };

  const handleAddOutreach = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedCampaign) return;

    try {
      const { error } = await supabase
        .from('campaign_outreaches')
        .insert({
          user_id: user.id,
          campaign_id: selectedCampaign.id,
          contact_id: outreachData.contact_id,
          variant: outreachData.variant,
          sent_at: outreachData.sent_at,
          response_received: false,
        });

      if (error) throw error;

      toast.success('Outreach logged');
      setIsOutreachFormOpen(false);
      resetOutreachForm();
      fetchCampaignOutreaches(selectedCampaign.id);
    } catch (error: any) {
      toast.error('Failed to log outreach', { description: error.message });
    }
  };

  const toggleResponse = async (outreachId: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('campaign_outreaches')
        .update({
          response_received: !currentState,
          response_date: !currentState ? new Date().toISOString() : null,
        })
        .eq('id', outreachId);

      if (error) throw error;

      if (selectedCampaign) {
        fetchCampaignOutreaches(selectedCampaign.id);
      }
    } catch (error: any) {
      toast.error('Failed to update response');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_companies: '',
      target_roles: '',
      goal: '',
      start_date: '',
      end_date: '',
    });
  };

  const resetOutreachForm = () => {
    setOutreachData({
      contact_id: '',
      variant: 'A',
      sent_at: format(new Date(), 'yyyy-MM-dd'),
    });
  };

  const calculateStats = () => {
    const variantA = outreaches.filter(o => o.variant === 'A');
    const variantB = outreaches.filter(o => o.variant === 'B');
    
    const responseRateA = variantA.length > 0
      ? (variantA.filter(o => o.response_received).length / variantA.length) * 100
      : 0;
    const responseRateB = variantB.length > 0
      ? (variantB.filter(o => o.response_received).length / variantB.length) * 100
      : 0;

    return {
      total: outreaches.length,
      responses: outreaches.filter(o => o.response_received).length,
      variantA: { count: variantA.length, responseRate: responseRateA },
      variantB: { count: variantB.length, responseRate: responseRateB },
    };
  };

  const stats = selectedCampaign ? calculateStats() : null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-3">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-display font-bold">Networking Campaigns</h1>
                <p className="text-muted-foreground">Track outreach volume and A/B test response rates</p>
              </div>
            </div>
            <Button onClick={() => setIsFormOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Campaign
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className={`cursor-pointer transition-colors ${
                  selectedCampaign?.id === campaign.id ? 'border-primary' : 'hover:border-primary/50'
                }`}
                onClick={() => setSelectedCampaign(campaign)}
              >
                <CardHeader>
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  {campaign.goal && (
                    <CardDescription className="line-clamp-2">{campaign.goal}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {campaign.target_companies.length > 0 && (
                      <div>
                        <span className="font-medium">Companies:</span>{' '}
                        {campaign.target_companies.slice(0, 2).join(', ')}
                        {campaign.target_companies.length > 2 && ` +${campaign.target_companies.length - 2}`}
                      </div>
                    )}
                    {campaign.target_roles.length > 0 && (
                      <div>
                        <span className="font-medium">Roles:</span>{' '}
                        {campaign.target_roles.slice(0, 2).join(', ')}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {campaigns.length === 0 && !isLoading && (
              <Card className="col-span-3">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Target className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    Create your first networking campaign to track outreach and responses
                  </p>
                  <Button onClick={() => setIsFormOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Campaign
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedCampaign && stats && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Total Outreaches</CardDescription>
                    <CardTitle className="text-3xl">{stats.total}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Responses</CardDescription>
                    <CardTitle className="text-3xl">{stats.responses}</CardTitle>
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Variant A Response Rate</CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.variantA.responseRate.toFixed(0)}%
                    </CardTitle>
                    <Progress value={stats.variantA.responseRate} className="mt-2" />
                  </CardHeader>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardDescription>Variant B Response Rate</CardDescription>
                    <CardTitle className="text-3xl">
                      {stats.variantB.responseRate.toFixed(0)}%
                    </CardTitle>
                    <Progress value={stats.variantB.responseRate} className="mt-2" />
                  </CardHeader>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Outreaches</CardTitle>
                      <CardDescription>Track contacts and responses for {selectedCampaign.name}</CardDescription>
                    </div>
                    <Button onClick={() => setIsOutreachFormOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Log Outreach
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {outreaches.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>No outreaches logged yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {outreaches.map((outreach) => (
                        <Card key={outreach.id}>
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold">{outreach.contact.name}</h4>
                                  <Badge variant={outreach.variant === 'A' ? 'default' : 'secondary'}>
                                    Variant {outreach.variant}
                                  </Badge>
                                  {outreach.response_received && (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                                      Responded
                                    </Badge>
                                  )}
                                </div>
                                {outreach.contact.company && (
                                  <p className="text-sm text-muted-foreground">{outreach.contact.company}</p>
                                )}
                                {outreach.sent_at && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Sent: {format(new Date(outreach.sent_at), 'MMM d, yyyy')}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant={outreach.response_received ? 'outline' : 'default'}
                                onClick={() => toggleResponse(outreach.id, outreach.response_received)}
                              >
                                {outreach.response_received ? 'Undo' : 'Mark Response'}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create Networking Campaign</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name *</Label>
              <Input
                placeholder="Q1 2024 Tech Company Outreach"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Target Companies (comma-separated)</Label>
              <Input
                placeholder="Google, Microsoft, Amazon"
                value={formData.target_companies}
                onChange={(e) => setFormData({ ...formData, target_companies: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Target Roles (comma-separated)</Label>
              <Input
                placeholder="Software Engineer, Product Manager"
                value={formData.target_roles}
                onChange={(e) => setFormData({ ...formData, target_roles: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Goal</Label>
              <Textarea
                placeholder="Land 3 informational interviews and 2 referrals"
                value={formData.goal}
                onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Campaign</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isOutreachFormOpen} onOpenChange={setIsOutreachFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Outreach</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddOutreach} className="space-y-4">
            <div className="space-y-2">
              <Label>Contact *</Label>
              <Select
                value={outreachData.contact_id}
                onValueChange={(value) => setOutreachData({ ...outreachData, contact_id: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select contact" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name} {contact.company && `- ${contact.company}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>A/B Variant *</Label>
              <Select
                value={outreachData.variant}
                onValueChange={(value: 'A' | 'B') => setOutreachData({ ...outreachData, variant: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Variant A</SelectItem>
                  <SelectItem value="B">Variant B</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sent Date *</Label>
              <Input
                type="date"
                value={outreachData.sent_at}
                onChange={(e) => setOutreachData({ ...outreachData, sent_at: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsOutreachFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log Outreach</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NetworkingCampaigns;