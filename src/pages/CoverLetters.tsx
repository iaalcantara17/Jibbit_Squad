import { Navigation } from '@/components/Navigation';
import { CoverLetterGenerator } from '@/components/cover-letters/CoverLetterGenerator';

const CoverLetters = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <div className="flex-1 container py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div>
            <h1 className="text-4xl font-display font-bold">AI Cover Letter Generator</h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Generate personalized cover letters tailored to each job opportunity
            </p>
          </div>
          
          <CoverLetterGenerator />
        </div>
      </div>
    </div>
  );
};

export default CoverLetters;
