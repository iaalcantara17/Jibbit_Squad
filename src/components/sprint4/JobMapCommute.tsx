import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { MapPin, Clock, Car, Home, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface JobWithCommute {
  id: string;
  title: string;
  company: string;
  location: string;
  latitude?: number;
  longitude?: number;
  commute_distance_miles?: number;
  commute_time_minutes?: number;
  status: string;
}

interface JobMapCommuteProps {
  jobs: JobWithCommute[];
  onJobsUpdated: () => void;
}

export const JobMapCommute = ({ jobs, onJobsUpdated }: JobMapCommuteProps) => {
  const { user } = useAuth();
  const [homeLocation, setHomeLocation] = useState('');
  const [maxCommuteTime, setMaxCommuteTime] = useState([60]);
  const [loading, setLoading] = useState(false);
  const [geocodedJobs, setGeocodedJobs] = useState<JobWithCommute[]>([]);

  useEffect(() => {
    loadHomeLocation();
  }, [user]);

  useEffect(() => {
    // Filter jobs by commute time when available
    if (geocodedJobs.length > 0) {
      const filtered = geocodedJobs.filter(job => 
        !job.commute_time_minutes || job.commute_time_minutes <= maxCommuteTime[0]
      );
      setGeocodedJobs(filtered);
    }
  }, [maxCommuteTime]);

  const loadHomeLocation = async () => {
    if (!user) return;
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('location')
      .eq('user_id', user.id)
      .maybeSingle();

    if (profile?.location) {
      setHomeLocation(profile.location);
    }
  };

  const calculateCommutes = async () => {
    if (!homeLocation.trim()) {
      toast.error('Please enter your home location first');
      return;
    }

    setLoading(true);
    try {
      // Save home location to profile
      await supabase
        .from('profiles')
        .update({ location: homeLocation })
        .eq('user_id', user?.id);

      // Get locations to geocode
      const locations = jobs
        .filter(job => job.location)
        .map(job => job.location);

      if (locations.length === 0) {
        toast.info('No job locations to calculate commutes for');
        setLoading(false);
        return;
      }

      // Call geocode function
      const { data, error } = await supabase.functions.invoke('geocode-location', {
        body: { 
          locations: [...new Set(locations)],
          homeLocation 
        }
      });

      if (error) throw error;

      // Map commute data back to jobs
      const jobsWithCommute = jobs.map(job => {
        const geocodeResult = data?.results?.find(
          (r: any) => r.location === job.location
        );

        return {
          ...job,
          latitude: geocodeResult?.latitude,
          longitude: geocodeResult?.longitude,
          commute_distance_miles: geocodeResult?.commute_distance_miles,
          commute_time_minutes: geocodeResult?.commute_time_minutes
        };
      });

      setGeocodedJobs(jobsWithCommute);
      toast.success('Commute times calculated successfully');
    } catch (error) {
      console.error('Error calculating commutes:', error);
      toast.error('Failed to calculate commute times');
    } finally {
      setLoading(false);
    }
  };

  const displayJobs = geocodedJobs.length > 0 ? geocodedJobs : jobs;

  const formatCommuteTime = (minutes?: number) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const getCommuteColor = (minutes?: number) => {
    if (!minutes) return 'bg-muted text-muted-foreground';
    if (minutes <= 30) return 'bg-green-500/20 text-green-600';
    if (minutes <= 45) return 'bg-yellow-500/20 text-yellow-600';
    if (minutes <= 60) return 'bg-orange-500/20 text-orange-600';
    return 'bg-red-500/20 text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Home Location & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-5 w-5" />
            Commute Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <Label htmlFor="home-location">Home Location</Label>
              <Input
                id="home-location"
                placeholder="e.g., San Francisco, CA"
                value={homeLocation}
                onChange={(e) => setHomeLocation(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={calculateCommutes} disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Calculate Commutes
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Maximum Commute Time</Label>
              <span className="text-sm text-muted-foreground">
                {maxCommuteTime[0]} minutes
              </span>
            </div>
            <Slider
              value={maxCommuteTime}
              onValueChange={setMaxCommuteTime}
              min={15}
              max={120}
              step={5}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>15 min</span>
              <span>2 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Jobs with Commute Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Jobs by Commute ({displayJobs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {displayJobs.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No jobs found within the specified commute time
            </p>
          ) : (
            <div className="space-y-3">
              {displayJobs
                .sort((a, b) => (a.commute_time_minutes || 999) - (b.commute_time_minutes || 999))
                .map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="font-medium">{job.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {job.company}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {job.location || 'Remote'}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {job.commute_time_minutes && (
                        <div className="text-right">
                          <Badge className={getCommuteColor(job.commute_time_minutes)}>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatCommuteTime(job.commute_time_minutes)}
                          </Badge>
                          {job.commute_distance_miles && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {job.commute_distance_miles.toFixed(1)} miles
                            </div>
                          )}
                        </div>
                      )}
                      <Badge variant="outline">{job.status}</Badge>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
