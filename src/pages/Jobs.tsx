import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, LayoutGrid, TrendingUp, Calendar, MapPin } from 'lucide-react';
import { JobForm } from '@/components/jobs/JobForm';
import { JobCard } from '@/components/jobs/JobCard';
import { JobDetailsModal } from '@/components/jobs/JobDetailsModal';
import { OffersList } from '@/components/jobs/OffersList';
import { NegotiationPrep } from '@/components/jobs/NegotiationPrep';
import { JobFilters } from '@/components/jobs/JobFilters';
import { DeadlineCalendar } from '@/components/jobs/DeadlineCalendar';
import { Job, JobFilters as JobFiltersType } from '@/types/jobs';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getStatusLabel, JOB_STATUS, PIPELINE_STAGES } from '@/lib/constants/jobStatus';
import { JobPipeline } from '@/components/jobs/JobPipeline';

const Jobs = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isOffersDialogOpen, setIsOffersDialogOpen] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'pipeline' | 'calendar'>(
    (searchParams.get('view') as any) || 'grid'
  );
  
  // Initialize filters from URL params
  const [filters, setFilters] = useState<JobFiltersType>(() => {
    const params: JobFiltersType = {
      isArchived: false,
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    
    if (searchParams.get('search')) params.search = searchParams.get('search')!;
    if (searchParams.get('status')) params.status = searchParams.get('status') as any;
    if (searchParams.get('salaryMin')) params.salaryMin = Number(searchParams.get('salaryMin'));
    if (searchParams.get('salaryMax')) params.salaryMax = Number(searchParams.get('salaryMax'));
    if (searchParams.get('deadlineFrom')) params.deadlineFrom = searchParams.get('deadlineFrom')!;
    if (searchParams.get('deadlineTo')) params.deadlineTo = searchParams.get('deadlineTo')!;
    if (searchParams.get('sortBy')) params.sortBy = searchParams.get('sortBy')!;
    if (searchParams.get('sortOrder')) params.sortOrder = searchParams.get('sortOrder') as any;
    
    return params;
  });
  const [debouncedFilters, setDebouncedFilters] = useState<JobFiltersType>(filters);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (filters.search) params.set('search', filters.search);
    if (filters.status) params.set('status', filters.status);
    if (filters.salaryMin) params.set('salaryMin', filters.salaryMin.toString());
    if (filters.salaryMax) params.set('salaryMax', filters.salaryMax.toString());
    if (filters.deadlineFrom) params.set('deadlineFrom', filters.deadlineFrom);
    if (filters.deadlineTo) params.set('deadlineTo', filters.deadlineTo);
    if (filters.sortBy) params.set('sortBy', filters.sortBy);
    if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
    if (viewMode !== 'grid') params.set('view', viewMode);
    
    setSearchParams(params, { replace: true });
  }, [filters, viewMode]);

  const statuses: Array<{ value: string; label: string; count: number }> = [
    { value: 'all', label: 'All Jobs', count: jobs.length },
    ...PIPELINE_STAGES.map(stage => ({
      value: stage.id,
      label: stage.label,
      count: jobs.filter(j => j.status === stage.id).length
    })),
  ];

  // Debounce search filter with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 300);

    return () => clearTimeout(timer);
  }, [filters]);

  const fetchJobs = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const jobsData = await api.jobs.getAll(debouncedFilters);
      setJobs(jobsData as any);
    } catch (error: any) {
      console.error('Error loading jobs:', error);
      toast.error(error?.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user, debouncedFilters]);

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    fetchJobs();
  };

  const handleDeleteJob = async (job: Job) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await api.jobs.delete(job.id!);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to delete job');
    }
  };

  const handleArchiveJob = async (job: Job) => {
    try {
      await api.jobs.archive(job.id!);
      toast.success('Job archived successfully');
      fetchJobs();
    } catch (error) {
      toast.error('Failed to archive job');
    }
  };

  const handleViewOffers = (job: Job) => {
    setSelectedJob(job);
    setIsOffersDialogOpen(true);
    setSelectedOfferId(null);
  };

  const handleSelectOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
  };

  const handleBackToOffers = () => {
    setSelectedOfferId(null);
  };

  const filteredJobs = selectedStatus === 'all'
    ? jobs.filter(j => !j.is_archived)
    : jobs.filter(j => j.status === selectedStatus && !j.is_archived);

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-display font-bold">Job Tracker</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                Manage your job applications and track your progress
              </p>
            </div>
            <div className="flex gap-3">
              <div className="flex gap-1 border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'pipeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('pipeline')}
                  className="rounded-none"
                >
                  <TrendingUp className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="rounded-l-none"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/jobs/map')}
                  className="rounded-l-none border-l"
                  title="Map View"
                >
                  <MapPin className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Job
              </Button>
            </div>
          </div>

          {/* Search and Filters */}
          <JobFilters
            filters={filters}
            onFiltersChange={setFilters}
            onClearFilters={() =>
              setFilters({ isArchived: false, sortBy: 'created_at', sortOrder: 'desc' })
            }
          />
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => setSelectedStatus(status.value)}
                className={`p-4 rounded-lg border transition-all ${
                  selectedStatus === status.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-2xl font-bold">{status.count}</div>
                <div className="text-sm text-muted-foreground">{status.label}</div>
              </button>
            ))}
          </div>

          {/* Jobs Grid/Pipeline/Calendar */}
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 && viewMode !== 'calendar' ? (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <p className="text-muted-foreground mb-4">
                {selectedStatus === 'all' ? 'No jobs yet' : `No jobs in ${selectedStatus} status`}
              </p>
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Job
              </Button>
            </div>
          ) : viewMode === 'calendar' ? (
            <DeadlineCalendar 
              jobs={jobs.filter(j => !j.is_archived)} 
              onJobClick={setSelectedJob}
            />
          ) : viewMode === 'pipeline' ? (
            <JobPipeline 
              jobs={jobs.filter(j => !j.is_archived)} 
              onJobUpdate={fetchJobs} 
            />
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onView={setSelectedJob}
                  onEdit={setSelectedJob}
                  onDelete={handleDeleteJob}
                  onArchive={handleArchiveJob}
                  onViewOffers={handleViewOffers}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Job Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Job</DialogTitle>
            <DialogDescription>
              Enter the details of the job you&apos;re interested in or paste a job posting URL to auto-fill
            </DialogDescription>
          </DialogHeader>
          <JobForm
            onSuccess={handleAddSuccess}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Job Details Modal */}
      <JobDetailsModal
        job={selectedJob}
        isOpen={!!selectedJob}
        onClose={() => setSelectedJob(null)}
        onUpdate={fetchJobs}
      />

      {/* Offers & Negotiation Dialog */}
      <Dialog open={isOffersDialogOpen} onOpenChange={setIsOffersDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedOfferId ? (
            <NegotiationPrep 
              offerId={selectedOfferId} 
              onBack={handleBackToOffers}
            />
          ) : (
            selectedJob && (
              <OffersList 
                jobId={selectedJob.id!} 
                onSelectOffer={handleSelectOffer}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Jobs;
