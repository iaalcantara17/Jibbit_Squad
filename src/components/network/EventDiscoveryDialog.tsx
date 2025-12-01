import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Search, MapPin, Calendar, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface EventDiscoveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSaved: () => void;
}

// Demo dataset for event discovery (fallback when API is not available)
const demoEventsByIndustry: Record<string, any[]> = {
  'technology': [
    { title: 'Tech Innovation Summit', date: '2024-03-15', location: 'San Francisco, CA', type: 'conference' },
    { title: 'AI & ML Meetup', date: '2024-03-20', location: 'New York, NY', type: 'meetup' },
    { title: 'Startup Pitch Night', date: '2024-03-25', location: 'Austin, TX', type: 'networking' },
  ],
  'finance': [
    { title: 'FinTech Forum', date: '2024-03-18', location: 'Chicago, IL', type: 'conference' },
    { title: 'Investment Banking Mixer', date: '2024-03-22', location: 'Boston, MA', type: 'networking' },
  ],
  'healthcare': [
    { title: 'HealthTech Expo', date: '2024-03-12', location: 'Seattle, WA', type: 'conference' },
    { title: 'Medical Professionals Network', date: '2024-03-28', location: 'Los Angeles, CA', type: 'meetup' },
  ],
  'default': [
    { title: 'Professional Networking Event', date: '2024-03-16', location: 'Various', type: 'networking' },
    { title: 'Industry Mixer', date: '2024-03-23', location: 'Various', type: 'networking' },
  ],
};

export const EventDiscoveryDialog = ({ open, onOpenChange, onEventSaved }: EventDiscoveryDialogProps) => {
  const [industry, setIndustry] = useState('');
  const [location, setLocation] = useState('');
  const [discoveredEvents, setDiscoveredEvents] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [usedDemoDataset, setUsedDemoDataset] = useState(false);

  const handleSearch = async () => {
    if (!industry.trim()) {
      toast.error('Please enter an industry');
      return;
    }

    setIsSearching(true);
    setUsedDemoDataset(false);

    try {
      // Try to call event discovery API
      const { data, error } = await supabase.functions.invoke('discover-events', {
        body: { industry: industry.trim().toLowerCase(), location: location.trim() }
      });

      if (error) throw error;

      if (data?.events && data.events.length > 0) {
        setDiscoveredEvents(data.events);
      } else {
        // Fallback to demo dataset
        useDemoDataset();
      }
    } catch (error) {
      // Fallback to demo dataset on any error
      useDemoDataset();
    } finally {
      setIsSearching(false);
    }
  };

  const useDemoDataset = () => {
    const industryKey = industry.trim().toLowerCase();
    const events = demoEventsByIndustry[industryKey] || demoEventsByIndustry['default'];
    
    // Filter by location if provided
    const filtered = location.trim()
      ? events.filter(e => e.location.toLowerCase().includes(location.trim().toLowerCase()))
      : events;

    setDiscoveredEvents(filtered);
    setUsedDemoDataset(true);
  };

  const handleSaveEvent = async (event: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('networking_events').insert({
        user_id: user.id,
        title: event.title,
        event_date: event.date,
        location: event.location,
        event_type: event.type === 'virtual' ? 'virtual' : 'in-person',
        attended: false,
      });

      if (error) throw error;

      toast.success('Event added to your calendar');
      onEventSaved();
    } catch (error: any) {
      toast.error('Failed to save event', { description: error.message });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discover Networking Events</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Industry *</Label>
              <Input
                placeholder="e.g., Technology, Finance, Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <div className="space-y-2">
              <Label>Location (optional)</Label>
              <Input
                placeholder="e.g., San Francisco, New York"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
          </div>

          <Button onClick={handleSearch} disabled={isSearching} className="w-full">
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? 'Searching...' : 'Search Events'}
          </Button>

          {usedDemoDataset && (
            <div className="text-sm text-muted-foreground text-center p-2 bg-muted rounded">
              📋 Showing demo dataset (external event API not configured)
            </div>
          )}

          {discoveredEvents.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-semibold">Discovered Events ({discoveredEvents.length})</h3>
              {discoveredEvents.map((event, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-base">{event.title}</CardTitle>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(event.date), 'MMM d, yyyy')}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {event.location}
                          </div>
                        </div>
                        <Badge variant="outline" className="capitalize mt-1">
                          {event.type}
                        </Badge>
                      </div>
                      <Button size="sm" onClick={() => handleSaveEvent(event)}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {!isSearching && discoveredEvents.length === 0 && industry && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No events found. Try different search terms.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
