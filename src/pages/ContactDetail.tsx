import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Building2, Edit, Mail, Phone, Star, User, Briefcase } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { InteractionTimeline } from '@/components/network/InteractionTimeline';
import { ContactReminders } from '@/components/network/ContactReminders';
import { ContactForm } from '@/components/network/ContactForm';
import { Dialog, DialogContent } from '@/components/ui/dialog';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState<any>(null);
  const [linkedJobs, setLinkedJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContactDetails();
      fetchLinkedJobs();
    }
  }, [id]);

  const fetchContactDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setContact(data);
    } catch (error: any) {
      toast.error('Failed to load contact', {
        description: error.message,
      });
      navigate('/contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLinkedJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('contact_job_links')
        .select(`
          job_id,
          jobs:job_id (
            id,
            job_title,
            company_name,
            status
          )
        `)
        .eq('contact_id', id);

      if (error) throw error;
      setLinkedJobs(data?.map(d => d.jobs) || []);
    } catch (error: any) {
      console.error('Failed to load linked jobs:', error);
    }
  };

  const renderStars = () => {
    const strength = contact?.relationship_strength || 3;
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < strength ? 'fill-primary text-primary' : 'text-muted-foreground'}`}
          />
        ))}
      </div>
    );
  };

  const handleEditSuccess = () => {
    setIsEditFormOpen(false);
    fetchContactDetails();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="flex-1 container py-8">
          <div className="max-w-5xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-muted animate-pulse rounded" />
            <div className="h-64 bg-muted animate-pulse rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!contact) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <Button variant="ghost" onClick={() => navigate('/contacts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Contacts
            </Button>
            <Button onClick={() => setIsEditFormOpen(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Contact
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="rounded-full bg-primary/10 p-4">
                    <User className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{contact.name}</CardTitle>
                    {contact.relationship_type && (
                      <p className="text-sm text-muted-foreground capitalize mt-1">
                        {contact.relationship_type}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 justify-end mb-1">
                    <span className="text-sm text-muted-foreground">Strength:</span>
                    {renderStars()}
                  </div>
                  {contact.last_contacted_at && (
                    <p className="text-sm text-muted-foreground">
                      Last contact: {formatDistanceToNow(new Date(contact.last_contacted_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  {contact.company && (
                    <div className="flex items-start gap-3">
                      <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{contact.company}</p>
                        {contact.role && <p className="text-sm text-muted-foreground">{contact.role}</p>}
                      </div>
                    </div>
                  )}

                  {contact.email && (
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
                        {contact.email}
                      </a>
                    </div>
                  )}

                  {contact.phone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <a href={`tel:${contact.phone}`} className="text-primary hover:underline">
                        {contact.phone}
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {contact.interests && (
                    <div>
                      <p className="text-sm font-medium mb-1">Interests</p>
                      <p className="text-sm text-muted-foreground">{contact.interests}</p>
                    </div>
                  )}

                  {contact.tags && contact.tags.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {contact.tags.map((tag: string, i: number) => (
                          <Badge key={i} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {linkedJobs.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Linked Jobs</p>
                      <div className="space-y-2">
                        {linkedJobs.map((job: any) => (
                          <div
                            key={job.id}
                            className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary"
                            onClick={() => navigate(`/jobs`)}
                          >
                            <Briefcase className="h-4 w-4" />
                            <span>{job.job_title} at {job.company_name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {contact.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">Notes</p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <InteractionTimeline contactId={contact.id} onUpdate={fetchContactDetails} />
            <ContactReminders contactId={contact.id} />
          </div>
        </div>
      </div>

      <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ContactForm
            contact={contact}
            onSuccess={handleEditSuccess}
            onCancel={() => setIsEditFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContactDetail;
