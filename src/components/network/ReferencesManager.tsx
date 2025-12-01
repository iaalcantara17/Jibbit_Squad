import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Copy, Star, FileText } from 'lucide-react';

interface ProfessionalReference {
  id: string;
  contact_id: string;
  contact: { name: string; company?: string; email?: string; phone?: string };
  relationship_description?: string;
  can_speak_to: string[];
  contact_preference: string;
  notes?: string;
  times_used: number;
}

const referenceTemplates = [
  {
    title: "Initial Reference Request",
    content: `Dear [Name],

I hope this email finds you well. I'm currently in the process of applying for [Position] roles, and I would be honored if you would consider serving as a professional reference for me.

Given our work together on [specific project/time period], I believe you can speak to [specific skills/qualities]. The reference check would likely involve [email/phone call], and I would be happy to provide you with details about the role and company when the time comes.

Would you be comfortable serving as a reference? I'm happy to discuss any questions you might have.

Thank you for considering this request.

Best regards,
[Your Name]`
  },
  {
    title: "Upcoming Reference Check Heads-Up",
    content: `Hi [Name],

I wanted to give you a heads up that [Company Name] may be reaching out to you as part of their reference check for the [Position] role I'm interviewing for.

Key points they might ask about:
- [Key responsibility/skill 1]
- [Key responsibility/skill 2]  
- [Key responsibility/skill 3]

The role involves [brief role description], which aligns well with the work we did on [specific project].

Let me know if you have any questions, and thank you again for your support!

Best,
[Your Name]`
  },
  {
    title: "Thank You After Reference",
    content: `Dear [Name],

I wanted to thank you for serving as a reference for me with [Company Name]. I really appreciate you taking the time to speak with them about our work together.

[Optional: I'm excited to share that I've accepted an offer with them / I'm still in the interview process / Unfortunately it didn't work out this time, but I appreciate your support.]

Your support means a lot to me, and I'm grateful to have you in my professional network.

Thank you again,
[Your Name]`
  }
];

export const ReferencesManager = () => {
  const [references, setReferences] = useState<ProfessionalReference[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isUsageFormOpen, setIsUsageFormOpen] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedReference, setSelectedReference] = useState<ProfessionalReference | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    contact_id: '',
    relationship_description: '',
    can_speak_to: '',
    contact_preference: 'email' as 'email' | 'phone' | 'either',
    notes: '',
  });

  const [usageData, setUsageData] = useState({
    job_id: '',
    notes: '',
  });

  useEffect(() => {
    fetchReferences();
    fetchContacts();
    fetchJobs();
  }, []);

  const fetchReferences = async () => {
    try {
      const { data, error } = await supabase
        .from('professional_references')
        .select('*, contact:contacts(name, company, email, phone)')
        .order('times_used', { ascending: false });

      if (error) throw error;
      setReferences(data || []);
    } catch (error: any) {
      toast.error('Failed to load references');
    } finally {
      setIsLoading(false);
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

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_title, company_name')
        .eq('is_archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast.error('Failed to load jobs');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const referenceData = {
        user_id: user.id,
        contact_id: formData.contact_id,
        relationship_description: formData.relationship_description || null,
        can_speak_to: formData.can_speak_to.split(',').map(s => s.trim()).filter(Boolean),
        contact_preference: formData.contact_preference,
        notes: formData.notes || null,
        times_used: 0,
      };

      const { error } = await supabase
        .from('professional_references')
        .insert(referenceData);

      if (error) throw error;

      toast.success('Reference added');
      setIsFormOpen(false);
      resetForm();
      fetchReferences();
    } catch (error: any) {
      toast.error('Failed to add reference', { description: error.message });
    }
  };

  const handleLogUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedReference) return;

    try {
      // Log the reference request
      const { error: requestError } = await supabase
        .from('reference_requests')
        .insert({
          user_id: user.id,
          reference_id: selectedReference.id,
          job_id: usageData.job_id || null,
          notes: usageData.notes || null,
        });

      if (requestError) throw requestError;

      // Increment times_used
      const { error: updateError } = await supabase
        .from('professional_references')
        .update({ times_used: selectedReference.times_used + 1 })
        .eq('id', selectedReference.id);

      if (updateError) throw updateError;

      toast.success('Reference usage logged');
      setIsUsageFormOpen(false);
      resetUsageForm();
      fetchReferences();
    } catch (error: any) {
      toast.error('Failed to log usage', { description: error.message });
    }
  };

  const resetForm = () => {
    setFormData({
      contact_id: '',
      relationship_description: '',
      can_speak_to: '',
      contact_preference: 'email',
      notes: '',
    });
  };

  const resetUsageForm = () => {
    setUsageData({
      job_id: '',
      notes: '',
    });
    setSelectedReference(null);
  };

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Template copied to clipboard');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Professional References</CardTitle>
              <CardDescription>Manage references and track usage per application</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowTemplates(true)}>
                <FileText className="h-4 w-4 mr-2" />
                Templates
              </Button>
              <Button onClick={() => setIsFormOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Reference
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 rounded-lg border bg-muted animate-pulse" />
              ))}
            </div>
          ) : references.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Star className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No references added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {references.map((reference) => (
                <Card key={reference.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-lg">{reference.contact.name}</h4>
                          <Badge variant="secondary">
                            Used {reference.times_used}x
                          </Badge>
                        </div>
                        
                        {reference.contact.company && (
                          <p className="text-sm text-muted-foreground">{reference.contact.company}</p>
                        )}

                        {reference.relationship_description && (
                          <p className="text-sm">{reference.relationship_description}</p>
                        )}

                        {reference.can_speak_to.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-1">Can speak to:</p>
                            <div className="flex flex-wrap gap-1">
                              {reference.can_speak_to.map((skill, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Contact: {reference.contact_preference}</span>
                          {reference.contact.email && <span>✉️ {reference.contact.email}</span>}
                          {reference.contact.phone && <span>📞 {reference.contact.phone}</span>}
                        </div>

                        {reference.notes && (
                          <p className="text-sm text-muted-foreground italic">{reference.notes}</p>
                        )}
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedReference(reference);
                          setIsUsageFormOpen(true);
                        }}
                      >
                        Log Usage
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Professional Reference</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Contact *</Label>
              <Select
                value={formData.contact_id}
                onValueChange={(value) => setFormData({ ...formData, contact_id: value })}
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
              <Label>Relationship Description</Label>
              <Input
                placeholder="Former manager at Acme Corp (2020-2022)"
                value={formData.relationship_description}
                onChange={(e) => setFormData({ ...formData, relationship_description: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Can Speak To (comma-separated)</Label>
              <Input
                placeholder="Leadership skills, technical expertise, team collaboration"
                value={formData.can_speak_to}
                onChange={(e) => setFormData({ ...formData, can_speak_to: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Preferred Contact Method</Label>
              <Select
                value={formData.contact_preference}
                onValueChange={(value: any) => setFormData({ ...formData, contact_preference: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="either">Either</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any special instructions or notes about this reference..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Reference</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isUsageFormOpen} onOpenChange={setIsUsageFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Reference Usage</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogUsage} className="space-y-4">
            <div className="space-y-2">
              <Label>Job Application (optional)</Label>
              <Select
                value={usageData.job_id}
                onValueChange={(value) => setUsageData({ ...usageData, job_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select job or leave blank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None</SelectItem>
                  {jobs.map((job) => (
                    <SelectItem key={job.id} value={job.id}>
                      {job.job_title} - {job.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes about this reference check..."
                value={usageData.notes}
                onChange={(e) => setUsageData({ ...usageData, notes: e.target.value })}
                rows={3}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={() => setIsUsageFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Log Usage</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Reference Request Templates</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {referenceTemplates.map((template, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{template.title}</CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyTemplate(template.content)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">
                    {template.content}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};