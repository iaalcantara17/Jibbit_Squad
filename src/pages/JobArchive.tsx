import { Navigation } from '@/components/Navigation';
import { JobArchiveView } from '@/components/jobs/JobArchiveView';

const JobArchive = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <JobArchiveView />
      </div>
    </div>
  );
};

export default JobArchive;
