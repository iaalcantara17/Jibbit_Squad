import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Plus, Users, ArrowRight, MessageSquare } from 'lucide-react';
import { ReferralRequestForm } from './ReferralRequestForm';
import { ReferralTemplateGenerator } from './ReferralTemplateGenerator';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';

interface ReferralRequestsSectionProps {
  job: any;
}

const statusColors = {
  draft: 'secondary',
  sent: 'default',
  followup: 'outline',
  accepted: 'default',
  declined: 'destructive',
} as const;

export const ReferralRequestsSection = ({ job }: ReferralRequestsSectionProps) => {
  const [suggestedContacts, setSuggestedContacts] = useState<any[]>([]);
  const [referralRequests, setReferralRequests] = useState<any[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestedContacts();
    fetchReferralRequests();
  }, [job.id]);

  const fetchSuggestedContacts = async () => {
    try {
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('*')
        .or(`company.ilike.%${job.company_name}%,tags.cs.{${job.industry || 'tech'}}`)
        .order('relationship_strength', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Filter out contacts that already have referral requests for this job
      const { data: existingRequests } = await supabase
        .from('referral_requests')
        .select('contact_id')
        .eq('job_id', job.id);

      const existingContactIds = new Set(existingRequests?.map(r => r.contact_id) || []);
      const filtered = contacts?.filter(c => !existingContactIds.has(c.id)) || [];
      
      setSuggestedContacts(filtered);
    } catch (error: any) {
      console.error('Failed to load suggested contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchReferralRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_requests')
        .select(`
          *,
          contact:contact_id (
            id,
            name,
            email,
            company,
            role,
            relationship_strength
          )
        `)
        .eq('job_id', job.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReferralRequests(data || []);
    } catch (error: any) {
      console.error('Failed to load referral requests:', error);
    }
  };

  const handleAddReferral = (contact?: any) => {
    setSelectedContact(contact);
    setSelectedRequest(null);
    setIsFormOpen(true);
  };

  const handleEditReferral = (request: any) => {
    setSelectedRequest(request);
    setSelectedContact(request.contact);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedContact(null);
    setSelectedRequest(null);
    fetchSuggestedContacts();
    fetchReferralRequests();
  };

  const handleGenerateTemplate = (contact: any) => {
    setSelectedContact(contact);
    setIsTemplateOpen(true);
  };

  const handleUpdateStatus = async (requestId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('referral_requests')
        .update({ 
          status: newStatus,
          last_action_at: new Date().toISOString(),
        })
        .eq('id', requestId);

      if (error) throw error;
      toast.success('Status updated');
      fetchReferralRequests();
    } catch (error: any) {
      toast.error('Failed to update status', {
        description: error.message,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Referrals
            </CardTitle>
            <Button size="sm" onClick={() => handleAddReferral()}>
              <Plus className="h-4 w-4 mr-2" />
              Request Referral
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Existing Referral Requests */}
          {referralRequests.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Active Requests</h3>
              <div className="space-y-2">
                {referralRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{request.contact.name}</p>
                        <Badge variant={statusColors[request.status as keyof typeof statusColors]}>
                          {request.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {request.contact.company} • {request.contact.role}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last action: {formatDistanceToNow(new Date(request.last_action_at), { addSuffix: true })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {request.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateTemplate(request.contact)}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Template
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditReferral(request)}
                      >
                        Update
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Contacts */}
          {suggestedContacts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">
                Suggested Contacts ({suggestedContacts.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                People who work at {job.company_name} or in similar roles
              </p>
              <div className="space-y-2">
                {suggestedContacts.slice(0, 5).map((contact) => (
                  <div
                    key={contact.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{contact.name}</p>
                        {contact.relationship_strength && contact.relationship_strength >= 4 && (
                          <Badge variant="secondary" className="text-xs">
                            Strong
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {contact.company} {contact.role && `• ${contact.role}`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddReferral(contact)}
                    >
                      Request
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-8">
              <div className="h-4 w-32 bg-muted animate-pulse rounded mx-auto" />
            </div>
          ) : suggestedContacts.length === 0 && referralRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No suggested contacts found</p>
              <p className="text-xs mt-1">
                Add contacts at {job.company_name} to get referral suggestions
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ReferralRequestForm
            job={job}
            contact={selectedContact}
            request={selectedRequest}
            onSuccess={handleFormSuccess}
            onCancel={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <ReferralTemplateGenerator
            job={job}
            contact={selectedContact}
            onClose={() => setIsTemplateOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
