import { toast } from "sonner";

export interface CSVColumn {
  header: string;
  accessor: string | ((row: any) => string | number);
}

export const exportToCSV = (
  data: any[],
  columns: CSVColumn[],
  filename: string
) => {
  try {
    // Create CSV header
    const headers = columns.map(col => col.header).join(',');
    
    // Create CSV rows
    const rows = data.map(row => {
      return columns.map(col => {
        let value: any;
        
        if (typeof col.accessor === 'function') {
          value = col.accessor(row);
        } else {
          value = row[col.accessor];
        }
        
        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }
        
        // Handle objects/arrays
        if (typeof value === 'object') {
          value = JSON.stringify(value);
        }
        
        // Escape quotes and wrap in quotes if contains comma or newline
        value = String(value);
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value.replace(/"/g, '""')}"`;
        }
        
        return value;
      }).join(',');
    }).join('\n');
    
    // Combine header and rows
    const csv = `${headers}\n${rows}`;
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("CSV exported successfully!");
  } catch (error) {
    console.error('Error exporting CSV:', error);
    toast.error("Failed to export CSV");
  }
};

// Predefined export configurations for common use cases
export const exportJobsToCSV = (jobs: any[]) => {
  const columns: CSVColumn[] = [
    { header: 'Job Title', accessor: 'job_title' },
    { header: 'Company', accessor: 'company_name' },
    { header: 'Location', accessor: 'location' },
    { header: 'Status', accessor: 'status' },
    { header: 'Salary Min', accessor: 'salary_min' },
    { header: 'Salary Max', accessor: 'salary_max' },
    { header: 'Applied Date', accessor: (row) => row.created_at ? new Date(row.created_at).toLocaleDateString() : '' },
    { header: 'Deadline', accessor: (row) => row.application_deadline ? new Date(row.application_deadline).toLocaleDateString() : '' },
    { header: 'Notes', accessor: 'notes' },
  ];
  
  exportToCSV(jobs, columns, 'job-applications');
};

export const exportAnalyticsToCSV = (analytics: any) => {
  const data = [
    { metric: 'Total Applications', value: analytics.totalApplications },
    { metric: 'Interview Rate', value: `${analytics.interviewRate}%` },
    { metric: 'Offer Rate', value: `${analytics.offerRate}%` },
    { metric: 'Rejection Rate', value: `${analytics.rejectionRate}%` },
    { metric: 'Active Applications', value: analytics.activeApplications },
    { metric: 'Average Time to Interview (days)', value: analytics.avgTimeToInterview || 'N/A' },
    { metric: 'Average Time to Offer (days)', value: analytics.avgTimeToOffer || 'N/A' },
    { metric: 'Deadline Adherence', value: `${analytics.deadlineAdherence || 0}%` },
  ];

  const columns: CSVColumn[] = [
    { header: 'Metric', accessor: 'metric' },
    { header: 'Value', accessor: 'value' },
  ];

  exportToCSV(data, columns, 'job-search-analytics');
};

export const exportInterviewsToCSV = (interviews: any[]) => {
  const columns: CSVColumn[] = [
    { header: 'Company', accessor: (row) => row.jobs?.company_name || '' },
    { header: 'Job Title', accessor: (row) => row.jobs?.job_title || '' },
    { header: 'Interview Date', accessor: (row) => row.interview_date ? new Date(row.interview_date).toLocaleString() : '' },
    { header: 'Type', accessor: 'interview_type' },
    { header: 'Interviewer', accessor: 'interviewer_name' },
    { header: 'Location', accessor: 'location' },
    { header: 'Preparation Status', accessor: 'preparation_status' },
    { header: 'Notes', accessor: 'notes' },
  ];

  exportToCSV(interviews, columns, 'interviews');
};

export const exportCoverLetterAnalytics = (analytics: any[]) => {
  const columns: CSVColumn[] = [
    { header: 'Cover Letter', accessor: (row) => row.cover_letters?.title || '' },
    { header: 'Variant', accessor: 'variant_name' },
    { header: 'Sent Date', accessor: (row) => new Date(row.sent_at).toLocaleDateString() },
    { header: 'Opened', accessor: (row) => row.opened ? 'Yes' : 'No' },
    { header: 'Responded', accessor: (row) => row.responded ? 'Yes' : 'No' },
    { header: 'Response Time (hours)', accessor: 'response_time_hours' },
    { header: 'Outcome', accessor: 'outcome' },
  ];

  exportToCSV(analytics, columns, 'cover-letter-analytics');
};
