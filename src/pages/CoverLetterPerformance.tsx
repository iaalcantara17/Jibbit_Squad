import { Navigation } from '@/components/Navigation';
import { CoverLetterPerformanceTrackerExtended } from '@/components/cover-letters/CoverLetterPerformanceTrackerExtended';

const CoverLetterPerformance = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold">Cover Letter Performance</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Track response rates and compare template effectiveness
            </p>
          </div>
          
          <CoverLetterPerformanceTrackerExtended />
        </div>
      </div>
    </div>
  );
};

export default CoverLetterPerformance;
