import { useState, useEffect } from 'react';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Search, Building2, DollarSign, Clock, Filter, List, Grid3X3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
}

const JobMap = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<JobLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedJob, setSelectedJob] = useState<JobLocation | null>(null);

  useEffect(() => {
    if (user) {
      fetchJobs();
    }
  }, [user]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('id, job_title, company_name, location, salary_min, salary_max, status, created_at')
        .eq('user_id', user?.id)
        .eq('is_archived', false);

      if (error) throw error;

      const mappedJobs: JobLocation[] = (data || []).map(job => ({
        id: job.id,
        title: job.job_title || '',
        company: job.company_name || '',
        location: job.location || '',
        salary_min: job.salary_min ?? undefined,
        salary_max: job.salary_max ?? undefined,
        status: job.status || 'saved',
        created_at: job.created_at,
      }));

      setJobs(mappedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (job.location?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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

  // Group jobs by location for map clusters
  const locationClusters = filteredJobs.reduce((acc, job) => {
    const key = job.location || 'Unknown';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(job);
    return acc;
  }, {} as Record<string, JobLocation[]>);

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
                Visualize your job applications by location
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

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
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
                  <SelectTrigger className="w-full md:w-48">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="saved">Saved</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="interviewing">Interviewing</SelectItem>
                    <SelectItem value="offered">Offered</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
                <div className="text-3xl font-bold">{Object.keys(locationClusters).length}</div>
                <p className="text-sm text-muted-foreground">Locations</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">
                  {filteredJobs.filter(j => j.status === 'interviewing').length}
                </div>
                <p className="text-sm text-muted-foreground">Interviewing</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-3xl font-bold">
                  {filteredJobs.filter(j => j.status === 'offered').length}
                </div>
                <p className="text-sm text-muted-foreground">Offers</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading jobs...</p>
            </div>
          ) : viewMode === 'map' ? (
            /* Map View - Interactive location clusters */
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>Location Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="h-full pb-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
                      {Object.entries(locationClusters).map(([location, locationJobs]) => (
                        <div
                          key={location}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:border-primary hover:shadow-md ${
                            selectedJob?.location === location ? 'border-primary bg-primary/5' : ''
                          }`}
                          onClick={() => setSelectedJob(locationJobs[0])}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium truncate">{location}</span>
                          </div>
                          <div className="text-2xl font-bold">{locationJobs.length}</div>
                          <p className="text-xs text-muted-foreground">
                            {locationJobs.length === 1 ? 'job' : 'jobs'}
                          </p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {locationJobs.slice(0, 3).map(job => (
                              <Badge key={job.id} variant="secondary" className="text-xs">
                                {job.company}
                              </Badge>
                            ))}
                            {locationJobs.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{locationJobs.length - 3}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Job Details Sidebar */}
              <div>
                <Card className="h-[600px]">
                  <CardHeader>
                    <CardTitle>
                      {selectedJob ? 'Jobs in ' + selectedJob.location : 'Select a Location'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[520px] overflow-y-auto">
                    {selectedJob ? (
                      <div className="space-y-3">
                        {locationClusters[selectedJob.location || 'Unknown']?.map(job => (
                          <div
                            key={job.id}
                            className="p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="font-medium">{job.title}</div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Building2 className="h-3 w-3" />
                              {job.company}
                            </div>
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <DollarSign className="h-3 w-3" />
                              {formatSalary(job.salary_min, job.salary_max)}
                            </div>
                            <Badge className={`mt-2 ${getStatusColor(job.status)}`}>
                              {job.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Click on a location to see job details
                      </p>
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
                        </div>
                      </div>
                      <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
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
