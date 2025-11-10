import { Navigation } from '@/components/Navigation';
import { ResumeBuilder } from '@/components/resumes/ResumeBuilder';

const Resumes = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold">AI Resume Builder</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Create tailored resumes with AI-powered content generation
            </p>
          </div>
          
          <ResumeBuilder />
        </div>
      </div>
    </div>
  );
};

export default Resumes;
