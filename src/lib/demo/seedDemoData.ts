/**
 * Sprint 3 Demo Data Seeding
 * Idempotent seeding for all demo requirements
 */

import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type JobInsert = Database['public']['Tables']['jobs']['Insert'];
type InterviewInsert = Database['public']['Tables']['interviews']['Insert'];
type QuestionInsert = Database['public']['Tables']['question_bank_items']['Insert'];
type ContactInsert = Database['public']['Tables']['contacts']['Insert'];

export interface SeedResult {
  jobs: number;
  interviews: number;
  companyResearch: number;
  questionBank: number;
  practiceResponses: number;
  mockSessions: number;
  technicalChallenges: number;
  technicalAttempts: number;
  followups: number;
  offers: number;
  contacts: number;
  networkingEvents: number;
  referralRequests: number;
  professionalReferences: number;
  informationalInterviews: number;
}

export async function seedDemoData(userId: string): Promise<SeedResult> {
  const result: SeedResult = {
    jobs: 0,
    interviews: 0,
    companyResearch: 0,
    questionBank: 0,
    practiceResponses: 0,
    mockSessions: 0,
    technicalChallenges: 0,
    technicalAttempts: 0,
    followups: 0,
    offers: 0,
    contacts: 0,
    networkingEvents: 0,
    referralRequests: 0,
    professionalReferences: 0,
    informationalInterviews: 0,
  };

  // Seed jobs (6+ for analytics)
  const jobsData: JobInsert[] = [
    {
      user_id: userId,
      job_title: 'Senior Frontend Engineer',
      company_name: 'TechCorp',
      status: 'Interview',
      location: 'San Francisco, CA',
      salary_min: 140000,
      salary_max: 180000,
      job_description: 'Building scalable React applications',
      industry: 'Technology',
    },
    {
      user_id: userId,
      job_title: 'Full Stack Developer',
      company_name: 'DataFlow Inc',
      status: 'Applied',
      location: 'Remote',
      salary_min: 130000,
      salary_max: 160000,
      job_description: 'End-to-end web development',
    },
    {
      user_id: userId,
      job_title: 'Product Engineer',
      company_name: 'InnovateLab',
      status: 'Offer',
      location: 'Austin, TX',
      salary_min: 150000,
      salary_max: 190000,
    },
    {
      user_id: userId,
      job_title: 'Software Engineer',
      company_name: 'CloudScale',
      status: 'Rejected',
      location: 'Seattle, WA',
      salary_min: 135000,
      salary_max: 175000,
    },
    {
      user_id: userId,
      job_title: 'Frontend Architect',
      company_name: 'DesignSys',
      status: 'Wishlist',
      location: 'New York, NY',
      salary_min: 160000,
      salary_max: 200000,
    },
    {
      user_id: userId,
      job_title: 'React Developer',
      company_name: 'StartupXYZ',
      status: 'Researching',
      location: 'Boston, MA',
      salary_min: 120000,
      salary_max: 150000,
    },
  ];

  const { data: jobs, error: jobsError } = await supabase
    .from('jobs')
    .upsert(jobsData, { onConflict: 'user_id,company_name,job_title', ignoreDuplicates: false })
    .select();

  if (!jobsError && jobs) result.jobs = jobs.length;

  const firstJobId = jobs?.[0]?.id;
  const secondJobId = jobs?.[1]?.id;
  const thirdJobId = jobs?.[2]?.id;

  // Seed interviews (3+ with different formats)
  if (firstJobId) {
    const interviewsData: InterviewInsert[] = [
      {
        user_id: userId,
        job_id: firstJobId,
        interview_type: 'video',
        status: 'scheduled',
        scheduled_start: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
        interviewer_names: ['Sarah Chen', 'Mike Johnson'],
        location: 'Zoom',
        video_link: 'https://zoom.us/j/demo123',
      },
      {
        user_id: userId,
        job_id: secondJobId || firstJobId,
        interview_type: 'onsite',
        status: 'scheduled',
        scheduled_start: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 240,
        interviewer_names: ['Tech Panel'],
        location: '123 Main St, Suite 500',
      },
      {
        user_id: userId,
        job_id: thirdJobId || firstJobId,
        interview_type: 'phone',
        status: 'completed',
        outcome: 'passed',
        scheduled_start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        scheduled_end: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        duration_minutes: 30,
        interviewer_names: ['HR Recruiter'],
      },
    ];

    const { data: interviews, error: interviewsError } = await supabase
      .from('interviews')
      .upsert(interviewsData, { onConflict: 'user_id,job_id,scheduled_start', ignoreDuplicates: false })
      .select();

    if (!interviewsError && interviews) {
      result.interviews = interviews.length;

      // Seed checklists for first interview (partially complete)
      if (interviews[0]) {
        await supabase.from('interview_checklists').upsert([
          {
            user_id: userId,
            interview_id: interviews[0].id,
            label: 'Research company values',
            category: 'Research',
            is_required: true,
            completed_at: new Date().toISOString(),
          },
          {
            user_id: userId,
            interview_id: interviews[0].id,
            label: 'Prepare STAR examples',
            category: 'Preparation',
            is_required: true,
          },
          {
            user_id: userId,
            interview_id: interviews[0].id,
            label: 'Test video/audio',
            category: 'Technical',
            is_required: true,
            completed_at: new Date().toISOString(),
          },
          {
            user_id: userId,
            interview_id: interviews[0].id,
            label: 'Prepare questions for interviewer',
            category: 'Preparation',
            is_required: false,
          },
        ], { onConflict: 'user_id,interview_id,label' });
      }

      // Seed follow-ups
      if (interviews[2]) {
        await supabase.from('interview_followups').upsert([
          {
            user_id: userId,
            interview_id: interviews[2].id,
            type: 'thank_you',
            status: 'sent',
            template_subject: 'Thank you for the opportunity',
            template_body: 'Thank you for taking the time to speak with me today...',
            sent_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            user_id: userId,
            interview_id: interviews[0].id,
            type: 'follow_up',
            status: 'draft',
            template_subject: 'Following up on our conversation',
            template_body: 'I wanted to follow up on our recent discussion...',
          },
        ], { onConflict: 'user_id,interview_id,type' });
        result.followups = 2;
      }
    }
  }

  // Seed company research
  if (firstJobId) {
    await supabase.from('company_research').upsert({
      user_id: userId,
      company_name: 'TechCorp',
      description: 'Leading technology company specializing in cloud infrastructure',
      industry: 'Technology',
      size: '1000-5000 employees',
      culture: 'Innovation-driven, collaborative, work-life balance focus',
      recent_news: [
        { title: 'TechCorp Raises $100M Series C', date: '2024-01-15', source: 'TechCrunch', url: 'https://techcrunch.com/demo' },
        { title: 'New Product Launch Q1 2024', date: '2024-02-01', source: 'Company Blog', url: 'https://techcorp.com/blog' },
        { title: 'Expansion to EMEA Markets', date: '2024-03-10', source: 'Business Wire', url: 'https://businesswire.com/demo' },
      ],
      key_people: [
        { name: 'Jane Doe', role: 'CEO', linkedin: 'https://linkedin.com/in/janedoe' },
        { name: 'John Smith', role: 'CTO', linkedin: 'https://linkedin.com/in/johnsmith' },
      ],
      competitors: ['CompetitorA', 'CompetitorB', 'CompetitorC'],
      glassdoor_rating: 4.2,
      ai_summary: 'TechCorp is a rapidly growing company with strong engineering culture and competitive compensation. Focus on cloud-native technologies and distributed systems.',
    }, { onConflict: 'user_id,company_name' });
    result.companyResearch = 1;
  }

  // Seed question bank (15+ items)
  const questionBankData: QuestionInsert[] = [
    { category: 'Behavioral', difficulty: 'Medium', role_title: 'Software Engineer', question_text: 'Tell me about a time when you had to deal with a difficult team member.', star_framework_hint: 'Focus on conflict resolution and communication skills.' },
    { category: 'Behavioral', difficulty: 'Hard', role_title: 'Senior Engineer', question_text: 'Describe a situation where you had to make a technical decision with incomplete information.', star_framework_hint: 'Emphasize decision-making process and risk assessment.' },
    { category: 'Technical', difficulty: 'Medium', role_title: 'Frontend Developer', question_text: 'Explain the difference between useEffect and useLayoutEffect in React.', linked_skills: ['React', 'JavaScript'] },
    { category: 'Technical', difficulty: 'Hard', role_title: 'Full Stack Developer', question_text: 'How would you design a rate-limiting system for an API?' },
    { category: 'Situational', difficulty: 'Easy', role_title: 'Software Engineer', question_text: 'How would you handle a situation where a sprint deadline is at risk?' },
    { category: 'Behavioral', difficulty: 'Easy', role_title: 'Software Engineer', question_text: 'What motivates you in your work?', star_framework_hint: 'Share genuine passion and connect to company mission.' },
    { category: 'Technical', difficulty: 'Medium', role_title: 'Backend Developer', question_text: 'Explain database indexing and when to use it.' },
    { category: 'Technical', difficulty: 'Hard', role_title: 'Software Engineer', question_text: 'Design a distributed caching system.', linked_skills: ['System Design', 'Distributed Systems'] },
    { category: 'Behavioral', difficulty: 'Medium', role_title: 'Lead Engineer', question_text: 'Tell me about a time you mentored a junior developer.' },
    { category: 'Situational', difficulty: 'Medium', role_title: 'Product Engineer', question_text: 'How would you prioritize features when stakeholders disagree?' },
    { category: 'Technical', difficulty: 'Easy', role_title: 'Frontend Developer', question_text: 'What is the virtual DOM in React?', linked_skills: ['React'] },
    { category: 'Technical', difficulty: 'Medium', role_title: 'Full Stack Developer', question_text: 'Explain REST vs GraphQL API design.' },
    { category: 'Behavioral', difficulty: 'Hard', role_title: 'Senior Engineer', question_text: 'Describe your biggest technical failure and what you learned.' },
    { category: 'Situational', difficulty: 'Hard', role_title: 'Tech Lead', question_text: 'How would you handle technical debt in a fast-paced startup?' },
    { category: 'Technical', difficulty: 'Easy', role_title: 'Software Engineer', question_text: 'What is the difference between == and === in JavaScript?', linked_skills: ['JavaScript'] },
    { category: 'Behavioral', difficulty: 'Medium', role_title: 'Software Engineer', question_text: 'How do you handle code review feedback?' },
  ];

  const { data: questions, error: questionsError } = await supabase
    .from('question_bank_items')
    .upsert(questionBankData, { onConflict: 'role_title,question_text', ignoreDuplicates: false })
    .select();

  if (!questionsError && questions) {
    result.questionBank = questions.length;

    // Seed practice responses (3+)
    if (questions.length >= 3) {
      const responseData = [
        {
          user_id: userId,
          question_id: questions[0].id,
          response_text: 'In my previous role, I worked with a team member who consistently missed deadlines. I scheduled a one-on-one meeting to understand the root cause. It turned out they were overwhelmed with tasks. We worked together to prioritize work and I helped them break down complex tasks into manageable pieces. This improved their performance and strengthened our working relationship.',
          status: 'completed',
          time_taken: 180,
        },
        {
          user_id: userId,
          question_id: questions[1].id,
          response_text: 'When migrating our authentication system, we had to choose between two approaches without complete performance data. I gathered what data we had, consulted with senior engineers, created a risk matrix, and made a decision based on our system constraints and future scalability needs. We chose the approach with lower risk and better long-term maintainability.',
          status: 'completed',
          time_taken: 210,
        },
        {
          user_id: userId,
          question_id: questions[2].id,
          response_text: 'useEffect runs after the DOM updates and paint, while useLayoutEffect runs synchronously after DOM mutations but before paint. useLayoutEffect is useful when you need to make DOM measurements or mutations that should be visible in the initial render.',
          status: 'completed',
          time_taken: 120,
        },
      ];

      const { data: responses } = await supabase
        .from('question_practice_responses')
        .upsert(responseData, { onConflict: 'user_id,question_id', ignoreDuplicates: false })
        .select();

      if (responses) {
        result.practiceResponses = responses.length;

        // Seed feedback
        await supabase.from('question_practice_feedback').upsert([
          {
            response_id: responses[0].id,
            overall_score: 8.5,
            relevance_score: 9,
            specificity_score: 8,
            impact_score: 8,
            clarity_score: 9,
            general_feedback: 'Strong STAR response with clear situation, action, and result. Good emphasis on collaboration and problem-solving.',
            star_adherence: { situation: true, task: true, action: true, result: true },
            speaking_time_estimate: 180,
          },
          {
            response_id: responses[1].id,
            overall_score: 9.0,
            relevance_score: 10,
            specificity_score: 9,
            impact_score: 8,
            clarity_score: 9,
            general_feedback: 'Excellent response demonstrating technical leadership and decision-making under uncertainty. Clear process explanation.',
            star_adherence: { situation: true, task: true, action: true, result: true },
            speaking_time_estimate: 210,
          },
          {
            response_id: responses[2].id,
            overall_score: 9.5,
            relevance_score: 10,
            specificity_score: 10,
            impact_score: 9,
            clarity_score: 10,
            general_feedback: 'Technically accurate and concise explanation. Good use of practical example.',
            speaking_time_estimate: 120,
          },
        ], { onConflict: 'response_id' });
      }
    }
  }

  // Seed mock interview session
  if (firstJobId && questions && questions.length >= 5) {
    const sessionData = {
      user_id: userId,
      job_id: firstJobId,
      target_role: 'Senior Frontend Engineer',
      company_name: 'TechCorp',
      format: 'behavioral',
      question_count: 5,
      status: 'completed',
      started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      completed_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
    };

    const { data: session } = await supabase
      .from('mock_interview_sessions')
      .upsert(sessionData, { onConflict: 'user_id,job_id,started_at', ignoreDuplicates: false })
      .select()
      .single();

    if (session) {
      result.mockSessions = 1;

      // Create responses
      for (let i = 0; i < 5; i++) {
        await supabase.from('mock_interview_responses').upsert({
          session_id: session.id,
          question_id: questions[i].id,
          question_order: i + 1,
          response_text: `Response to question ${i + 1}...`,
          is_followup: false,
          started_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + i * 9 * 60 * 1000).toISOString(),
          answered_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000 + (i + 1) * 9 * 60 * 1000).toISOString(),
          time_taken: 540,
        }, { onConflict: 'session_id,question_id' });
      }

      // Create summary
      await supabase.from('mock_interview_summaries').upsert({
        session_id: session.id,
        completion_rate: 100,
        avg_response_length: 250,
        strongest_category: 'Behavioral',
        weakest_category: 'Technical',
        top_improvements: [
          'Add more quantifiable metrics to answers',
          'Practice concise technical explanations',
          'Strengthen situational responses',
        ],
        ai_summary: 'Strong performance overall with good STAR framework usage. Focus on adding more specific metrics and practicing technical depth.',
      }, { onConflict: 'session_id' });
    }
  }

  // Seed technical challenges (3+)
  const challengesData = [
    {
      title: 'Implement a Debounce Function',
      category: 'JavaScript',
      difficulty: 'Medium',
      tech_stack: ['JavaScript', 'TypeScript'],
      problem_statement: 'Create a debounce function that delays the execution of a function until after a specified wait time.',
      solution_framework: 'Use closures and setTimeout to implement the delay mechanism.',
      best_practices: 'Handle edge cases like leading/trailing calls, cleanup on unmount.',
    },
    {
      title: 'Design a LRU Cache',
      category: 'Data Structures',
      difficulty: 'Hard',
      tech_stack: ['Algorithms', 'System Design'],
      problem_statement: 'Implement a Least Recently Used (LRU) cache with O(1) get and put operations.',
      solution_framework: 'Combine HashMap and Doubly Linked List for optimal performance.',
    },
    {
      title: 'Build a React Component with Hooks',
      category: 'React',
      difficulty: 'Easy',
      tech_stack: ['React', 'TypeScript'],
      problem_statement: 'Create a custom hook for fetching data with loading and error states.',
      solution_framework: 'Use useState, useEffect, and proper cleanup patterns.',
    },
  ];

  const { data: challenges } = await supabase
    .from('technical_challenges')
    .upsert(challengesData, { onConflict: 'title', ignoreDuplicates: false })
    .select();

  if (challenges) {
    result.technicalChallenges = challenges.length;

    // Seed one attempt
    if (challenges[0]) {
      await supabase.from('technical_practice_attempts').upsert({
        user_id: userId,
        challenge_id: challenges[0].id,
        language: 'typescript',
        solution_code: 'function debounce(fn, delay) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; }',
        status: 'completed',
        started_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        submitted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
        time_taken: 30,
        rubric_checklist: { functionality: true, edgeCases: true, cleanCode: true },
      }, { onConflict: 'user_id,challenge_id,started_at' });
      result.technicalAttempts = 1;
    }
  }

  // Seed offers
  if (thirdJobId) {
    await supabase.from('offers').upsert([
      {
        user_id: userId,
        job_id: thirdJobId,
        base_salary: 155000,
        bonus: 20000,
        equity: '0.15% vesting over 4 years',
        status: 'pending',
        market_data: {
          min: 145000,
          max: 175000,
          sources: [
            { name: 'levels.fyi', url: 'https://levels.fyi', value: 160000 },
            { name: 'Glassdoor', url: 'https://glassdoor.com', value: 152000 },
            { name: 'Blind', url: 'https://teamblind.com', value: 158000 },
          ],
        },
        confidence_checklist: {
          researched_market: true,
          identified_leverage: true,
          set_walkaway: false,
          prepared_questions: false,
          practiced_scripts: false,
        },
        notes: 'Strong offer with good equity component. Market research suggests room for 5-10% negotiation.',
      },
      {
        user_id: userId,
        job_id: secondJobId || thirdJobId,
        base_salary: 145000,
        bonus: 15000,
        status: 'accepted',
        market_data: { min: 135000, max: 165000, sources: [] },
      },
    ], { onConflict: 'user_id,job_id', ignoreDuplicates: false });
    result.offers = 2;
  }

  // Seed contacts (8+)
  const contactsData: ContactInsert[] = [
    { user_id: userId, name: 'Alice Johnson', email: 'alice@example.com', company: 'TechCorp', role: 'Engineering Manager', relationship_type: 'Mentor', relationship_strength: 5, tags: ['tech', 'mentor'] },
    { user_id: userId, name: 'Bob Smith', email: 'bob@example.com', company: 'DataFlow Inc', role: 'Senior Developer', relationship_type: 'Colleague', relationship_strength: 4, tags: ['tech', 'colleague'] },
    { user_id: userId, name: 'Carol Davis', email: 'carol@example.com', company: 'InnovateLab', role: 'Product Manager', relationship_type: 'Professional', relationship_strength: 3 },
    { user_id: userId, name: 'David Lee', email: 'david@example.com', company: 'CloudScale', role: 'Tech Lead', relationship_type: 'Professional', relationship_strength: 4, tags: ['tech', 'referral'] },
    { user_id: userId, name: 'Emma Wilson', email: 'emma@example.com', company: 'DesignSys', role: 'UX Designer', relationship_type: 'Colleague', relationship_strength: 3 },
    { user_id: userId, name: 'Frank Chen', email: 'frank@example.com', company: 'StartupXYZ', role: 'Founder', relationship_type: 'Professional', relationship_strength: 5, tags: ['startup', 'founder'] },
    { user_id: userId, name: 'Grace Martinez', email: 'grace@example.com', company: 'TechCorp', role: 'Staff Engineer', relationship_type: 'Mentor', relationship_strength: 5, tags: ['tech', 'mentor'] },
    { user_id: userId, name: 'Henry Taylor', email: 'henry@example.com', company: 'DataFlow Inc', role: 'VP Engineering', relationship_type: 'Referrer', relationship_strength: 4, tags: ['executive', 'referral'] },
  ];

  const { data: contacts } = await supabase
    .from('contacts')
    .upsert(contactsData, { onConflict: 'user_id,email', ignoreDuplicates: false })
    .select();

  if (contacts) {
    result.contacts = contacts.length;

    // Seed contact interactions
    if (contacts[0]) {
      await supabase.from('contact_interactions').upsert([
        {
          user_id: userId,
          contact_id: contacts[0].id,
          interaction_type: 'coffee_chat',
          interaction_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'positive',
          notes: 'Discussed career growth and got advice on leadership path.',
        },
        {
          user_id: userId,
          contact_id: contacts[1].id,
          interaction_type: 'linkedin_message',
          interaction_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          outcome: 'positive',
          notes: 'Reconnected and discussed potential opportunities.',
        },
      ], { onConflict: 'user_id,contact_id,interaction_date' });

      // Seed reminders
      await supabase.from('contact_reminders').upsert([
        {
          user_id: userId,
          contact_id: contacts[0].id,
          reminder_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          notes: 'Follow up on career advice discussion',
          completed: false,
        },
      ], { onConflict: 'user_id,contact_id,reminder_date' });
    }

    // Seed referral requests
    if (contacts[3] && firstJobId) {
      await supabase.from('referral_requests').upsert({
        user_id: userId,
        contact_id: contacts[3].id,
        job_id: firstJobId,
        status: 'pending',
        message_sent: 'Hi David, I saw an opening at TechCorp that aligns perfectly with my experience...',
        last_action_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        next_followup_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }, { onConflict: 'user_id,contact_id,job_id' });
      result.referralRequests = 1;
    }

    // Seed professional references
    if (contacts[6]) {
      const { data: refs } = await supabase.from('professional_references').upsert([
        {
          user_id: userId,
          contact_id: contacts[6].id,
          relationship_description: 'Worked together at TechCorp for 2 years',
          can_speak_to: ['Technical Skills', 'Leadership', 'Collaboration'],
          contact_preference: 'email',
          notes: 'Can speak to my technical depth and mentoring abilities',
        },
        {
          user_id: userId,
          contact_id: contacts[0].id,
          relationship_description: 'Manager for 18 months',
          can_speak_to: ['Leadership', 'Project Management', 'Team Collaboration'],
          contact_preference: 'phone',
        },
      ], { onConflict: 'user_id,contact_id', ignoreDuplicates: false }).select();

      if (refs) {
        result.professionalReferences = refs.length;

        // Seed reference request
        if (refs[0] && thirdJobId) {
          await supabase.from('reference_requests').upsert({
            user_id: userId,
            reference_id: refs[0].id,
            job_id: thirdJobId,
            requested_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            notes: 'Requested for final round at InnovateLab',
          }, { onConflict: 'user_id,reference_id,job_id' });
        }
      }
    }

    // Seed informational interviews
    if (contacts[2] && contacts[5]) {
      await supabase.from('informational_interviews').upsert([
        {
          user_id: userId,
          contact_id: contacts[2].id,
          status: 'completed',
          outreach_sent_at: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
          scheduled_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          outcome_notes: 'Great conversation about product management career path. Got valuable insights.',
          prep_checklist: {
            research_completed: true,
            questions_prepared: true,
            goals_defined: true,
            topics: ['Product management transition', 'InnovateLab culture'],
          },
        },
        {
          user_id: userId,
          contact_id: contacts[5].id,
          status: 'scheduled',
          outreach_sent_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          scheduled_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          prep_checklist: {
            research_completed: true,
            questions_prepared: false,
            goals_defined: true,
            topics: ['Startup life', 'Founding story'],
          },
        },
      ], { onConflict: 'user_id,contact_id' });
      result.informationalInterviews = 2;
    }
  }

  // Seed networking events
  await supabase.from('networking_events').upsert([
    {
      user_id: userId,
      title: 'Tech Meetup - React Best Practices',
      event_date: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: 'in-person',
      location: 'Downtown Convention Center',
      attended: true,
      goals: 'Meet React developers, learn about new patterns',
      notes: 'Met 5 new contacts, learned about Server Components',
      prep_checklist: ['Research speakers', 'Prepare elevator pitch', 'Bring business cards'],
    },
    {
      user_id: userId,
      title: 'Virtual Career Fair',
      event_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      event_type: 'virtual',
      attended: false,
      goals: 'Connect with recruiters, explore new opportunities',
      prep_checklist: ['Update resume', 'Prepare questions', 'Test video setup'],
    },
  ], { onConflict: 'user_id,title,event_date' });
  result.networkingEvents = 2;

  // Seed goals for tracking
  await supabase.from('goals').upsert([
    {
      user_id: userId,
      title: 'Land Senior Engineer Role',
      category: 'career',
      status: 'in_progress',
      target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      specific: 'Secure a senior-level position at a tech company',
      measurable: 'Apply to 20 companies, get 5 interviews',
      achievable: 'Leverage current skills and network',
      relevant: 'Aligns with career growth goals',
      time_bound: '90 days from today',
      milestones: [
        { title: 'Update resume and portfolio', completed: true },
        { title: 'Apply to 10 companies', completed: true },
        { title: 'Complete 3 interviews', completed: false },
      ],
    },
  ], { onConflict: 'user_id,title' });

  // Seed time tracking for analytics
  if (firstJobId) {
    await supabase.from('time_tracking').upsert([
      {
        user_id: userId,
        activity_type: 'Interview Prep',
        job_id: firstJobId,
        started_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ended_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 120,
        notes: 'Researched company and practiced questions',
      },
    ], { onConflict: 'user_id,activity_type,started_at' });
  }

  return result;
}
