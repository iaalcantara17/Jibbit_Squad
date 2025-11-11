import { 
  exportResumeToPDF, 
  exportCoverLetterToPDF,
  exportResumeToText,
  exportCoverLetterToText,
  exportResumeToWord,
  exportCoverLetterToWord,
  exportResumeToHTML,
  exportCoverLetterToHTML,
  exportJobsToCSV 
} from '@/lib/exportService';

export const useExport = () => {
  return {
    exportResumeToPDF,
    exportCoverLetterToPDF,
    exportResumeToText,
    exportCoverLetterToText,
    exportResumeToWord,
    exportCoverLetterToWord,
    exportResumeToHTML,
    exportCoverLetterToHTML,
    exportJobsToCSV,
  };
};