/**
 * Production Seed Script
 * Seeds initial content for production environment (UC-140)
 * 
 * Run with: npx tsx scripts/seed-production.ts
 */

// Sample job postings for demonstration
export const sampleJobs = [
  {
    job_title: 'Senior Software Engineer',
    company_name: 'TechCorp Inc.',
    location: 'San Francisco, CA',
    employment_type: 'Full-time',
    salary_min: 150000,
    salary_max: 200000,
    description: 'Join our engineering team to build scalable solutions...',
    requirements: ['5+ years experience', 'React/TypeScript', 'Cloud platforms'],
    status: 'saved'
  },
  {
    job_title: 'Product Manager',
    company_name: 'StartupXYZ',
    location: 'New York, NY',
    employment_type: 'Full-time',
    salary_min: 130000,
    salary_max: 170000,
    description: 'Lead product strategy and roadmap development...',
    requirements: ['3+ years PM experience', 'Agile methodology', 'Data-driven'],
    status: 'saved'
  },
  {
    job_title: 'Data Scientist',
    company_name: 'Analytics Corp',
    location: 'Remote',
    employment_type: 'Full-time',
    salary_min: 140000,
    salary_max: 180000,
    description: 'Apply ML and statistical methods to solve business problems...',
    requirements: ['Python/R', 'Machine Learning', 'SQL'],
    status: 'saved'
  }
];

// Common industries
export const industries = [
  'Technology',
  'Finance',
  'Healthcare',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media & Entertainment',
  'Real Estate',
  'Non-profit'
];

// Common job titles by level
export const jobTitlesByLevel = {
  entry: [
    'Software Engineer',
    'Product Analyst',
    'Marketing Coordinator',
    'Sales Representative',
    'Customer Success Associate'
  ],
  mid: [
    'Senior Software Engineer',
    'Product Manager',
    'Marketing Manager',
    'Account Executive',
    'Customer Success Manager'
  ],
  senior: [
    'Staff Engineer',
    'Senior Product Manager',
    'Director of Marketing',
    'Sales Director',
    'VP of Customer Success'
  ],
  executive: [
    'VP of Engineering',
    'Chief Product Officer',
    'CMO',
    'CRO',
    'CEO'
  ]
};

// Interview questions bank
export const interviewQuestions = {
  behavioral: [
    'Tell me about a time you handled conflict in a team.',
    'Describe a situation where you had to meet a tight deadline.',
    'Give an example of when you showed leadership.',
    'Tell me about a time you failed and what you learned.',
    'Describe a situation where you had to adapt to change.',
    'Tell me about your greatest professional achievement.'
  ],
  technical: [
    'Explain the difference between REST and GraphQL.',
    'How would you optimize a slow database query?',
    'Describe your approach to code review.',
    'How do you ensure code quality in your projects?',
    'Explain microservices architecture.',
    'How do you handle technical debt?'
  ],
  situational: [
    'How would you handle a disagreement with your manager?',
    'What would you do if you discovered a bug right before release?',
    'How would you prioritize multiple urgent tasks?',
    'What would you do if a team member was underperforming?',
    'How would you approach learning a new technology quickly?'
  ],
  culture: [
    'Why do you want to work for this company?',
    'What type of work environment do you thrive in?',
    'How do you stay motivated during challenging times?',
    'What are you looking for in your next role?',
    'How do you handle feedback and criticism?'
  ]
};

// Skills taxonomy for autocomplete
export const skillsTaxonomy = {
  programming: [
    'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'Go', 'Rust',
    'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB'
  ],
  frontend: [
    'React', 'Vue.js', 'Angular', 'Svelte', 'Next.js', 'HTML', 'CSS',
    'Tailwind CSS', 'SASS', 'Bootstrap', 'Material UI', 'Webpack', 'Vite'
  ],
  backend: [
    'Node.js', 'Express', 'Django', 'Flask', 'Spring Boot', 'Rails',
    'ASP.NET', 'FastAPI', 'GraphQL', 'REST API', 'gRPC'
  ],
  database: [
    'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch',
    'DynamoDB', 'Cassandra', 'SQLite', 'Oracle', 'SQL Server'
  ],
  cloud: [
    'AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes',
    'Terraform', 'Serverless', 'CI/CD', 'Jenkins', 'GitHub Actions'
  ],
  soft: [
    'Communication', 'Leadership', 'Problem Solving', 'Teamwork',
    'Time Management', 'Critical Thinking', 'Adaptability', 'Creativity'
  ]
};

// FAQ content
export const faqContent = [
  {
    question: 'How do I track a new job application?',
    answer: 'Click the "Add Job" button on the Jobs page, enter the job details, and save. You can then update the status as you progress through the application process.'
  },
  {
    question: 'Can I import jobs from LinkedIn or Indeed?',
    answer: 'Yes! Use our browser extension or email forwarding feature to automatically import job postings from major job boards.'
  },
  {
    question: 'How does the AI resume optimization work?',
    answer: 'Our AI analyzes job descriptions and your resume to identify keyword gaps and suggest improvements to increase your match score.'
  },
  {
    question: 'Is my data secure?',
    answer: 'Absolutely. We use encryption for all data in transit and at rest, and never share your personal information with third parties.'
  },
  {
    question: 'How do I connect my calendar?',
    answer: 'Go to Settings > Integrations and click "Connect Calendar". Follow the prompts to authorize access to your Google or Outlook calendar.'
  },
  {
    question: 'What does the competitive analysis feature show?',
    answer: 'It estimates the number of applicants for a role, your competitive score, and provides strategies to differentiate your application.'
  }
];

// Getting started guide
export const gettingStartedGuide = {
  title: 'Getting Started with JibbitATS',
  steps: [
    {
      title: 'Complete Your Profile',
      description: 'Add your work experience, education, and skills to unlock personalized recommendations.'
    },
    {
      title: 'Create Your Resume',
      description: 'Use our resume builder to create a professional resume optimized for ATS systems.'
    },
    {
      title: 'Start Tracking Jobs',
      description: 'Add jobs you\'re interested in and track your application progress through each stage.'
    },
    {
      title: 'Connect Your Calendar',
      description: 'Sync your calendar to automatically add interview reminders and never miss an important meeting.'
    },
    {
      title: 'Prepare for Interviews',
      description: 'Use our question bank and AI practice mode to prepare for your upcoming interviews.'
    }
  ]
};

// Template resumes (structure only, not real content)
export const resumeTemplates = [
  {
    name: 'Modern Professional',
    description: 'Clean, modern design perfect for corporate roles',
    sections: ['summary', 'experience', 'education', 'skills']
  },
  {
    name: 'Technical Expert',
    description: 'Emphasizes technical skills and projects',
    sections: ['summary', 'technical_skills', 'experience', 'projects', 'education']
  },
  {
    name: 'Creative Portfolio',
    description: 'Showcase creative work and achievements',
    sections: ['summary', 'portfolio', 'experience', 'skills', 'education']
  }
];

// Cover letter templates
export const coverLetterTemplates = [
  {
    name: 'Standard Professional',
    description: 'Traditional format for most applications',
    tone: 'professional'
  },
  {
    name: 'Startup Enthusiast',
    description: 'Energetic tone for startup positions',
    tone: 'enthusiastic'
  },
  {
    name: 'Executive Leader',
    description: 'Authoritative tone for senior roles',
    tone: 'authoritative'
  }
];

console.log('Production seed data exported successfully.');
console.log('Industries:', industries.length);
console.log('Job titles:', Object.values(jobTitlesByLevel).flat().length);
console.log('Interview questions:', Object.values(interviewQuestions).flat().length);
console.log('Skills:', Object.values(skillsTaxonomy).flat().length);
console.log('FAQ items:', faqContent.length);
