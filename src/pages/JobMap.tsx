import { useState, useEffect, useMemo, useCallback } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Building2, DollarSign, Clock, Filter, List, Grid3X3, Navigation2, Home } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { LeafletMap } from '@/components/jobs/LeafletMap';

interface JobLocation {
  id: string;
  title: string;
  company: string;
  location: string;
  latitude?: number;
  longitude?: number;
  salary_min?: number;
  salary_max?: number;
  status: string;
  created_at: string;
  work_type?: string;
  commute_distance?: number;
  commute_time?: number;
}

interface UserHomeLocation {
  latitude: number;
  longitude: number;
  address: string;
}

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Estimate commute time (assuming avg 30 mph in traffic)
function estimateCommuteTime(distanceMiles: number): number {
  return Math.round(distanceMiles / 30 * 60); // minutes
}

const JobMap = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [workTypeFilter, setWorkTypeFilter] = useState('all');
  const [maxDistance, setMaxDistance] = useState<number>(50);
  const [maxCommuteTime, setMaxCommuteTime] = useState<number>(60);
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null);
  const [homeLocation, setHomeLocation] = useState<UserHomeLocation | null>(null);
  const [homeAddressInput, setHomeAddressInput] = useState('');
  const [showHomeForm, setShowHomeForm] = useState(false);

  useEffect(() => {
    if (user) {
      fetchJobs();
      fetchHomeLocation();
    }
  }, [user]);

  const fetchHomeLocation = async () => {
    try {
      const { data, error } = await supabase
        .from('user_home_location')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (data && data.latitude && data.longitude) {
        setHomeLocation({
          latitude: Number(data.latitude),
          longitude: Number(data.longitude),
          address: data.address || '',
        });
      }
    } catch (error) {
      // No home location set yet
    }
  };

  const geocodeAddress = async (address: string): Promise<{ lat: number; lon: number } | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`,
        { headers: { 'User-Agent': 'ATS-Candidates-App' } }
      );
      const data = await response.json();
      if (data && data[0]) {
        return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
      }
      return null;
    } catch {
      return null;
    }
  };

  const saveHomeLocation = async () => {
    if (!homeAddressInput.trim()) {
      toast.error('Please enter an address');
      return;
    }

    const coords = await geocodeAddress(homeAddressInput);
    if (!coords) {
      toast.error('Could not find that address. Please try a more specific address.');
      return;
    }

    try {
      await supabase.from('user_home_location').upsert({
        user_id: user?.id,
        latitude: coords.lat,
        longitude: coords.lon,
        address: homeAddressInput,
      });

      setHomeLocation({
        latitude: coords.lat,
        longitude: coords.lon,
        address: homeAddressInput,
      });
      setShowHomeForm(false);
      toast.success('Home location saved');
      
      // Recalculate commute distances
      fetchJobs();
    } catch (error) {
      toast.error('Failed to save home location');
    }
  };

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_title, company_name, location, salary_min, salary_max, status, created_at')
        .eq('user_id', user?.id)
        .eq('is_archived', false);

      if (error) throw error;

      // Geocode job locations and calculate commute distances
      const jobsWithCoords: JobLocation[] = await Promise.all(
        (data || []).map(async (job) => {
          let latitude: number | undefined;
          let longitude: number | undefined;
          let commute_distance: number | undefined;
          let commute_time: number | undefined;

          // Infer work type from location
          const locationLower = (job.location || '').toLowerCase();
          const work_type = locationLower.includes('remote') 
            ? 'remote' 
            : locationLower.includes('hybrid') 
              ? 'hybrid' 
              : 'onsite';

          // Check geocoded_locations cache first
          if (job.location && work_type !== 'remote') {
            const { data: cached } = await supabase
              .from('geocoded_locations')
              .select('latitude, longitude')
              .eq('location_string', job.location)
              .single();

            if (cached && cached.latitude && cached.longitude) {
              latitude = Number(cached.latitude);
              longitude = Number(cached.longitude);
            } else {
              // Geocode and cache
              const coords = await geocodeAddress(job.location);
              if (coords) {
                latitude = coords.lat;
                longitude = coords.lon;
                // Cache the result
                try {
                  await supabase.from('geocoded_locations').insert({
                    location_string: job.location,
                    latitude: coords.lat,
                    longitude: coords.lon,
                  });
                } catch {
                  // Ignore cache errors
                }
              }
            }
          }

          // Calculate commute if we have both locations
          if (homeLocation && latitude && longitude) {
            commute_distance = calculateDistance(
              homeLocation.latitude,
              homeLocation.longitude,
              latitude,
              longitude
            );
            commute_time = estimateCommuteTime(commute_distance);
          }

          return {
            id: job.id,
            title: job.job_title || '',
            company: job.company_name || '',
            location: job.location || '',
            latitude,
            longitude,
            salary_min: job.salary_min ?? undefined,
            salary_max: job.salary_max ?? undefined,
            status: job.status || 'saved',
            created_at: job.created_at,
            work_type,
            commute_distance: commute_distance ? Math.round(commute_distance * 10) / 10 : undefined,
            commute_time,
          };
        })
      );

      setJobs(jobsWithCoords);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      const matchesSearch = 
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesWorkType = workTypeFilter === 'all' || job.work_type === workTypeFilter;
      
      // Distance filter (only apply to non-remote jobs with coordinates)
      const matchesDistance = 
        workTypeFilter === 'remote' || 
        !job.commute_distance || 
        job.commute_distance <= maxDistance;
      
      const matchesCommuteTime = 
        workTypeFilter === 'remote' || 
        !job.commute_time || 
        job.commute_time <= maxCommuteTime;
      
      return matchesSearch && matchesStatus && matchesWorkType && matchesDistance && matchesCommuteTime;
    });
  }, [jobs, searchTerm, statusFilter, workTypeFilter, maxDistance, maxCommuteTime]);

  const jobsWithCoordinates = filteredJobs.filter(j => j.latitude && j.longitude);

  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'Not specified';
    if (min && max) return `$${(min/1000).toFixed(0)}k - $${(max/1000).toFixed(0)}k`;
    if (min) return `$${(min/1000).toFixed(0)}k+`;
    return `Up to $${(max!/1000).toFixed(0)}k`;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      saved: 'bg-muted text-muted-foreground',
      applied: 'bg-primary/20 text-primary',
      interviewing: 'bg-warning/20 text-warning',
      offered: 'bg-success/20 text-success',
      rejected: 'bg-destructive/20 text-destructive',
    };
    return colors[status] || 'bg-muted text-muted-foreground';
  };

  const mapCenter: [number, number] = homeLocation 
    ? [homeLocation.latitude, homeLocation.longitude]
    : jobsWithCoordinates[0] 
      ? [jobsWithCoordinates[0].latitude!, jobsWithCoordinates[0].longitude!]
      : [39.8283, -98.5795]; // Center of USA

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold flex items-center gap-2">
                <MapPin className="h-8 w-8 text-primary" />
                Job Map
              </h1>
              <p className="text-muted-foreground mt-2">
                Visualize your job applications by location with commute estimates
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <Grid3X3 className="h-4 w-4 mr-2" />
                Map View
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4 mr-2" />
                List View
              </Button>
            </div>
          </div>

          {/* Home Location */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Home className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">Home Location</p>
                    <p className="text-sm text-muted-foreground">
                      {homeLocation ? homeLocation.address : 'Not set - add to calculate commute times'}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowHomeForm(!showHomeForm)}>
                  {homeLocation ? 'Update' : 'Set Location'}
                </Button>
              </div>
              
              {showHomeForm && (
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Enter your home address..."
                    value={homeAddressInput}
                    onChange={(e) => setHomeAddressInput(e.target.value)}
                  />
                  <Button onClick={saveHomeLocation}>Save</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by job title, company, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={workTypeFilter} onValueChange={setWorkTypeFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue placeholder="Work Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {homeLocation && workTypeFilter !== 'remote' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span>Max Distance</span>
                      <span className="text-muted-foreground">{maxDistance} miles</span>
                    </Label>
                    <Slider
                      value={[maxDistance]}
                      onValueChange={([val]) => setMaxDistance(val)}
                      min={5}
                      max={100}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span>Max Commute Time</span>
                      <span className="text-muted-foreground">{maxCommuteTime} min</span>
                    </Label>
                    <Slider
                      value={[maxCommuteTime]}
                      onValueChange={([val]) => setMaxCommuteTime(val)}
                      min={15}
                      max={120}
                      step={15}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{filteredJobs.length}</div>
                <p className="text-sm text-muted-foreground">Total Jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">{jobsWithCoordinates.length}</div>
                <p className="text-sm text-muted-foreground">On Map</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">
                  {filteredJobs.filter(j => j.work_type === 'remote').length}
                </div>
                <p className="text-sm text-muted-foreground">Remote</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">
                  {filteredJobs.filter(j => j.commute_time && j.commute_time <= 30).length}
                </div>
                <p className="text-sm text-muted-foreground">{"< 30 min commute"}</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading jobs and geocoding locations...</p>
            </div>
          ) : viewMode === 'map' ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card className="h-[600px] overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle>Interactive Map</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 h-[540px]">
                    <LeafletMap
                      center={mapCenter}
                      jobs={jobsWithCoordinates.map(job => ({
                        id: job.id,
                        title: job.title,
                        company: job.company,
                        location: job.location,
                        latitude: job.latitude!,
                        longitude: job.longitude!,
                        commute_distance: job.commute_distance,
                        commute_time: job.commute_time,
                      }))}
                      homeLocation={homeLocation}
                      onJobSelect={(job) => setSelectedJob(
                        jobsWithCoordinates.find(j => j.id === job.id) || null
                      )}
                    />
                  </CardContent>
                </Card>
              </div>

              {/* Job Details Sidebar */}
              <div>
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>
                      {selectedJob ? selectedJob.title : 'Select a Job'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[520px] overflow-y-auto">
                    {selectedJob ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedJob.company}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedJob.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          <span>{formatSalary(selectedJob.salary_min, selectedJob.salary_max)}</span>
                        </div>
                        {selectedJob.commute_distance && (
                          <div className="flex items-center gap-2">
                            <Navigation2 className="h-4 w-4 text-primary" />
                            <span className="text-primary">
                              {selectedJob.commute_distance} miles • ~{selectedJob.commute_time} min commute
                            </span>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Badge className={getStatusColor(selectedJob.status)}>
                            {selectedJob.status}
                          </Badge>
                          <Badge variant="outline">{selectedJob.work_type}</Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredJobs.slice(0, 10).map(job => (
                          <div
                            key={job.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => setSelectedJob(job)}
                          >
                            <div className="font-medium text-sm">{job.title}</div>
                            <div className="text-xs text-muted-foreground">{job.company}</div>
                            {job.commute_time && (
                              <div className="text-xs text-primary mt-1">
                                ~{job.commute_time} min commute
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* List View */
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {filteredJobs.map(job => (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="font-medium">{job.title}</div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {job.company}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {job.location || 'Remote'}
                          </span>
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatSalary(job.salary_min, job.salary_max)}
                          </span>
                          {job.commute_time && (
                            <span className="flex items-center gap-1 text-primary">
                              <Navigation2 className="h-3 w-3" />
                              {job.commute_distance} mi • {job.commute_time} min
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{job.work_type}</Badge>
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {filteredJobs.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      No jobs found matching your criteria
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMap;
