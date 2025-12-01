import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, Building2, Users, GraduationCap, Plus, TrendingUp } from 'lucide-react';

interface ContactDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactAdded: () => void;
}

export const ContactDiscoveryDialog = ({ open, onOpenChange, onContactAdded }: ContactDiscoveryDialogProps) => {
  const [targetCompany, setTargetCompany] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [suggestedContacts, setSuggestedContacts] = useState<any[]>([]);
  const [mutualInterests, setMutualInterests] = useState<any[]>([]);
  const [connectionPaths, setConnectionPaths] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (open) {
      loadInitialData();
    }
  }, [open]);

  const loadInitialData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user's contacts to build connection graph
      const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id);

      // Find mutual interests (contacts with similar tags)
      if (contacts && contacts.length > 0) {
        const matches = contacts
          .filter(c => {
            if (!c.tags || c.tags.length === 0) return false;
            const contactTags = (c.tags as string[]).map(t => t.toLowerCase());
            // Check if any tag appears in other contacts
            return contacts.some(other => 
              other.id !== c.id && 
              other.tags && Array.isArray(other.tags) &&
              (other.tags as string[]).some(t => contactTags.includes(t.toLowerCase()))
            );
          })
          .slice(0, 5);

        setMutualInterests(matches);
      }
    } catch (error) {
      console.error('Failed to load discovery data:', error);
    }
  };

  const handleSearch = async () => {
    if (!targetCompany && !targetRole) {
      toast.error('Please enter a company or role');
      return;
    }

    setIsSearching(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Search for contacts matching criteria
      let query = supabase
        .from('contacts')
        .select('*')
        .eq('user_id', user.id);

      if (targetCompany) {
        query = query.ilike('company', `%${targetCompany}%`);
      }
      if (targetRole) {
        query = query.ilike('role', `%${targetRole}%`);
      }

      const { data: matches, error } = await query.limit(10);

      if (error) throw error;

      setSuggestedContacts(matches || []);
      
      // Build connection paths (simplified: 2nd degree connections)
      if (matches && matches.length > 0) {
        const paths = matches.map(contact => ({
          contact,
          path: '1st degree connection',
          strength: contact.relationship_strength || 3,
        }));
        setConnectionPaths(paths);
      }
    } catch (error: any) {
      toast.error('Search failed', { description: error.message });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddToContacts = async (contact: any) => {
    toast.success(`${contact.name} is already in your contacts!`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discover Industry Contacts</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="targeted" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="targeted">
              <Building2 className="h-4 w-4 mr-2" />
              Targeted
            </TabsTrigger>
            <TabsTrigger value="mutual">
              <Users className="h-4 w-4 mr-2" />
              Mutual Interests
            </TabsTrigger>
            <TabsTrigger value="paths">
              <TrendingUp className="h-4 w-4 mr-2" />
              Connection Paths
            </TabsTrigger>
          </TabsList>

          <TabsContent value="targeted" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Target Company</Label>
                <Input
                  placeholder="e.g., Google, Microsoft"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="space-y-2">
                <Label>Target Role</Label>
                <Input
                  placeholder="e.g., Software Engineer, Product Manager"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>

            <Button onClick={handleSearch} disabled={isSearching} className="w-full">
              <Search className="h-4 w-4 mr-2" />
              {isSearching ? 'Searching...' : 'Find Contacts'}
            </Button>

            {suggestedContacts.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold">Suggested Contacts ({suggestedContacts.length})</h3>
                {suggestedContacts.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {contact.role && `${contact.role} • `}{contact.company}
                          </p>
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.tags.slice(0, 3).map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline">In Network</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="mutual" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Contacts who share similar interests or tags with you
            </p>
            {mutualInterests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No mutual interest matches found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {mutualInterests.map((contact) => (
                  <Card key={contact.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <h4 className="font-semibold">{contact.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {contact.company} {contact.role && `• ${contact.role}`}
                          </p>
                          {contact.tags && contact.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.tags.map((tag: string, i: number) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge>Match</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="paths" className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connection paths to target contacts
            </p>
            {connectionPaths.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No connection paths found. Search for targets first.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {connectionPaths.map((item, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.contact.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.contact.company} {item.contact.role && `• ${item.contact.role}`}
                            </p>
                          </div>
                          <Badge variant="outline">{item.path}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>Strength:</span>
                          <div className="flex gap-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className={`h-2 w-2 rounded-full ${
                                  i < item.strength ? 'bg-primary' : 'bg-muted'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
