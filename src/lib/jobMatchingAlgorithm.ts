interface Job {
  job_title: string;
  job_description: string;
  company_name: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
}

interface Profile {
  skills: Array<{ name: string; level: string }>;
  employment_history: Array<{ title: string; company: string; description: string }>;
  education: Array<{ degree: string; field: string; institution: string }>;
  experience_level?: string;
  location?: string;
}

interface MatchScore {
  overall_score: number;
  skills_score: number;
  experience_score: number;
  education_score: number;
  location_score: number;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

const extractKeywords = (text: string): string[] => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3);
};

const calculateSimilarity = (set1: Set<string>, set2: Set<string>): number => {
  const intersection = new Set([...set1].filter((x) => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  return union.size > 0 ? intersection.size / union.size : 0;
};

export const calculateJobMatch = (job: Job, profile: Profile): MatchScore => {
  const jobKeywords = new Set(extractKeywords(job.job_description + ' ' + job.job_title));
  
  // Skills matching
  const userSkills = new Set(profile.skills.map((s) => s.name.toLowerCase()));
  const skillsScore = calculateSimilarity(userSkills, jobKeywords) * 100;

  // Experience matching
  const experienceKeywords = new Set(
    profile.employment_history.flatMap((exp) =>
      extractKeywords(exp.title + ' ' + exp.description)
    )
  );
  const experienceScore = calculateSimilarity(experienceKeywords, jobKeywords) * 100;

  // Education matching
  const educationKeywords = new Set(
    profile.education.flatMap((edu) =>
      extractKeywords(edu.degree + ' ' + edu.field)
    )
  );
  const educationScore = calculateSimilarity(educationKeywords, jobKeywords) * 100;

  // Location matching
  let locationScore = 50; // Default neutral
  if (profile.location && job.location) {
    const userLoc = profile.location.toLowerCase();
    const jobLoc = job.location.toLowerCase();
    if (userLoc === jobLoc || jobLoc.includes('remote')) {
      locationScore = 100;
    } else if (userLoc.split(',')[0] === jobLoc.split(',')[0]) {
      locationScore = 75; // Same city/state
    }
  }

  // Overall weighted score
  const overall_score = Math.round(
    skillsScore * 0.4 +
    experienceScore * 0.35 +
    educationScore * 0.15 +
    locationScore * 0.1
  );

  // Identify strengths
  const strengths: string[] = [];
  if (skillsScore >= 70) strengths.push('Strong skill match');
  if (experienceScore >= 70) strengths.push('Relevant experience');
  if (educationScore >= 70) strengths.push('Educational background aligns');
  if (locationScore >= 90) strengths.push('Location match');

  // Identify gaps
  const gaps: string[] = [];
  const missingSkills = [...jobKeywords].filter((kw) => !userSkills.has(kw));
  if (missingSkills.length > 5) {
    gaps.push(`${missingSkills.slice(0, 3).join(', ')} and ${missingSkills.length - 3} more skills`);
  }
  if (skillsScore < 50) gaps.push('Skills gap detected');
  if (experienceScore < 50) gaps.push('Limited relevant experience');

  // Recommendations
  const recommendations: string[] = [];
  if (skillsScore < 60) {
    recommendations.push('Highlight transferable skills in your resume');
    recommendations.push('Consider adding relevant certifications');
  }
  if (experienceScore < 60) {
    recommendations.push('Emphasize relevant projects and achievements');
  }
  if (overall_score >= 70) {
    recommendations.push('Strong match - prioritize this application');
  } else if (overall_score >= 50) {
    recommendations.push('Good match - tailor your materials carefully');
  } else {
    recommendations.push('Stretch opportunity - emphasize learning potential');
  }

  return {
    overall_score,
    skills_score: Math.round(skillsScore),
    experience_score: Math.round(experienceScore),
    education_score: Math.round(educationScore),
    location_score: Math.round(locationScore),
    strengths,
    gaps,
    recommendations,
  };
};
