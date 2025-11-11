import { OPENAI_API_KEY } from "../config.js";

// AI Service for Resume and Cover Letter Generation
// Uses OpenAI GPT-4o-mini for content generation

/**
 * Generate resume content using AI
 * @param {Object} user - User profile data
 * @param {Object} job - Job data (optional, for tailoring)
 * @param {Array} sections - Sections to generate content for
 * @returns {Promise<Object>} Generated content by section
 */
export const generateResumeContent = async (user, job, sections) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const prompt = buildResumePrompt(user, job, sections);

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert resume writer and career coach. Generate professional, ATS-optimized resume content that highlights achievements and uses strong action verbs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || "OpenAI API error");
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;

    return parseGeneratedContent(generatedText, sections);
  } catch (error) {
    console.error("AI generation error:", error);
    throw error;
  }
};

/**
 * Optimize skills list for a specific job
 * @param {Array} userSkills - User's current skills
 * @param {Object} job - Job data
 * @returns {Promise<Object>} Optimized skills with relevance scores
 */
export const optimizeSkills = async (userSkills, job) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const jobTitle = job.jobTitle || job.title;
  const companyName = typeof job.company === 'string' ? job.company : job.company.name;
  const jobDescription = job.jobDescription || job.description || "";

  const prompt = `Analyze these skills for a ${jobTitle} position at ${companyName}:

User's Skills: ${userSkills.map(s => s.name).join(', ')}

Job Description: ${jobDescription.substring(0, 1000)}

Tasks:
1. Rank skills by relevance (1-10)
2. Suggest skills to emphasize
3. Identify missing skills from job requirements
4. Categorize skills (Technical, Soft, Industry-Specific)

Return as JSON: { "rankedSkills": [{"skill": "name", "relevance": 9, "category": "Technical"}], "missingSkills": ["skill1"], "suggestions": ["text"] }`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert ATS optimization specialist. Analyze skills and provide structured JSON output."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.5,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { rankedSkills: [], missingSkills: [], suggestions: [] };
  } catch (error) {
    console.error("Skills optimization error:", error);
    throw error;
  }
};

/**
 * Tailor work experience for a specific job
 * @param {Array} experiences - User's employment history
 * @param {Object} job - Job data
 * @returns {Promise<Array>} Tailored experience descriptions
 */
export const tailorExperience = async (experiences, job) => {
  if (!OPENAI_API_KEY) {
    throw new Error("OpenAI API key not configured");
  }

  const jobTitle = job.jobTitle || job.title;
  const jobDescription = job.jobDescription || job.description || "";

  const experienceSummary = experiences.map(exp => ({
    jobTitle: exp.jobTitle,
    company: exp.company,
    description: exp.description
  }));

  const prompt = `Tailor these work experiences for a ${jobTitle} position:

${JSON.stringify(experienceSummary, null, 2)}

Job Description: ${jobDescription.substring(0, 1000)}

For each experience:
1. Rewrite bullets to emphasize relevant skills
2. Use strong action verbs
3. Quantify achievements where possible
4. Focus on transferable skills
5. Keep descriptions concise (2-4 bullets each)

Return as JSON array: [{"jobTitle": "...", "company": "...", "bullets": ["...", "..."]}]`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are an expert resume writer. Generate compelling, achievement-focused experience descriptions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse JSON from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return [];
  } catch (error) {
    console.error("Experience tailoring error:", error);
    throw error;
  }
};

// Helper function to build resume generation prompt
function buildResumePrompt(user, job, sections) {
  let prompt = `Generate professional resume content for:\n\nUser Profile:\n`;
  prompt += `Name: ${user.name}\n`;
  prompt += `Email: ${user.email}\n`;

  if (user.basicInfo && user.basicInfo.length > 0) {
    const basic = user.basicInfo[0];
    if (basic.professionalHeadline) prompt += `Headline: ${basic.professionalHeadline}\n`;
    if (basic.bio) prompt += `Bio: ${basic.bio}\n`;
  }

  if (user.employmentHistory && user.employmentHistory.length > 0) {
    prompt += `\nWork Experience:\n`;
    user.employmentHistory.forEach(exp => {
      prompt += `- ${exp.jobTitle} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n`;
      if (exp.description) prompt += `  ${exp.description}\n`;
    });
  }

  if (user.skills && user.skills.length > 0) {
    prompt += `\nSkills: ${user.skills.map(s => s.name).join(', ')}\n`;
  }

  if (job) {
    const jobTitle = job.jobTitle || job.title;
    const companyName = typeof job.company === 'string' ? job.company : job.company.name;
    prompt += `\n\nTailor content for this job:\nPosition: ${jobTitle}\nCompany: ${companyName}\n`;
    if (job.jobDescription || job.description) {
      prompt += `Job Description: ${(job.jobDescription || job.description).substring(0, 500)}...\n`;
    }
  }

  prompt += `\nGenerate content for these sections: ${sections.join(', ')}\n`;
  prompt += `\nProvide professional, ATS-optimized content with strong action verbs and quantified achievements.`;

  return prompt;
}

// Helper function to parse generated content
function parseGeneratedContent(text, sections) {
  const content = {};
  
  sections.forEach(section => {
    // Simple parsing - can be enhanced based on actual response format
    const sectionRegex = new RegExp(`${section}:?\\s*([\\s\\S]*?)(?=\\n\\n|$)`, 'i');
    const match = text.match(sectionRegex);
    
    if (match) {
      content[section] = match[1].trim();
    }
  });

  return content;
}
