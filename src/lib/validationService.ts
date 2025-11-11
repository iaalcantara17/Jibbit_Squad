// Resume and Cover Letter Validation Service

export interface ValidationIssue {
  type: 'error' | 'warning' | 'suggestion';
  category: 'spelling' | 'grammar' | 'length' | 'formatting' | 'tone' | 'content';
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  score: number; // 0-100
  readabilityScore?: number;
  wordCount?: number;
  characterCount?: number;
}

// Spell check using basic dictionary
const COMMON_MISSPELLINGS: Record<string, string> = {
  'teh': 'the',
  'recieve': 'receive',
  'occured': 'occurred',
  'seperate': 'separate',
  'definately': 'definitely',
  'accomodate': 'accommodate',
  'succesful': 'successful',
  'managment': 'management',
  'experiance': 'experience',
  'responsability': 'responsibility'
};

export const checkSpelling = (text: string): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const words = text.toLowerCase().split(/\s+/);
  
  words.forEach((word, index) => {
    const cleanWord = word.replace(/[^a-z]/g, '');
    if (COMMON_MISSPELLINGS[cleanWord]) {
      issues.push({
        type: 'error',
        category: 'spelling',
        message: `Possible spelling error: "${word}"`,
        suggestion: COMMON_MISSPELLINGS[cleanWord]
      });
    }
  });
  
  return issues;
};

// Basic grammar check
export const checkGrammar = (text: string): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  
  // Check for double spaces
  if (text.includes('  ')) {
    issues.push({
      type: 'warning',
      category: 'formatting',
      message: 'Multiple consecutive spaces found',
      suggestion: 'Use single spaces between words'
    });
  }
  
  // Check for missing punctuation at end of sentences
  const sentences = text.split(/[.!?]\s+/);
  if (sentences.length > 0 && !text.trim().match(/[.!?]$/)) {
    issues.push({
      type: 'warning',
      category: 'grammar',
      message: 'Missing punctuation at the end',
      suggestion: 'End your document with proper punctuation'
    });
  }
  
  // Check for sentences starting with lowercase
  sentences.forEach((sentence) => {
    const trimmed = sentence.trim();
    if (trimmed.length > 0 && trimmed[0] !== trimmed[0].toUpperCase()) {
      issues.push({
        type: 'warning',
        category: 'grammar',
        message: `Sentence should start with capital letter: "${trimmed.substring(0, 30)}..."`,
        suggestion: 'Capitalize the first letter'
      });
    }
  });
  
  return issues;
};

// Calculate readability score (Flesch Reading Ease)
export const calculateReadability = (text: string): number => {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (sentences.length === 0 || words.length === 0) return 0;
  
  const avgWordsPerSentence = words.length / sentences.length;
  const avgSyllablesPerWord = syllables / words.length;
  
  // Flesch Reading Ease formula
  const score = 206.835 - (1.015 * avgWordsPerSentence) - (84.6 * avgSyllablesPerWord);
  
  // Normalize to 0-100
  return Math.max(0, Math.min(100, score));
};

const countSyllables = (word: string): number => {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  const vowels = 'aeiouy';
  let count = 0;
  let prevWasVowel = false;
  
  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevWasVowel) count++;
    prevWasVowel = isVowel;
  }
  
  // Subtract silent 'e'
  if (word.endsWith('e')) count--;
  
  return Math.max(1, count);
};

// Check document length
export const checkLength = (text: string, type: 'resume' | 'cover-letter'): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  
  if (type === 'resume') {
    // Resume should be 400-800 words (1-2 pages)
    if (wordCount < 400) {
      issues.push({
        type: 'warning',
        category: 'length',
        message: `Resume is too short (${wordCount} words). Aim for 400-800 words.`,
        suggestion: 'Add more details about your experience and achievements'
      });
    } else if (wordCount > 800) {
      issues.push({
        type: 'warning',
        category: 'length',
        message: `Resume is too long (${wordCount} words). Aim for 400-800 words.`,
        suggestion: 'Be more concise and focus on the most relevant information'
      });
    }
  } else if (type === 'cover-letter') {
    // Cover letter should be 250-400 words
    if (wordCount < 250) {
      issues.push({
        type: 'warning',
        category: 'length',
        message: `Cover letter is too short (${wordCount} words). Aim for 250-400 words.`,
        suggestion: 'Expand on your qualifications and interest in the position'
      });
    } else if (wordCount > 400) {
      issues.push({
        type: 'warning',
        category: 'length',
        message: `Cover letter is too long (${wordCount} words). Aim for 250-400 words.`,
        suggestion: 'Be more concise and focus on key points'
      });
    }
  }
  
  return issues;
};

// Analyze tone
export const analyzeTone = (text: string): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  const lowerText = text.toLowerCase();
  
  // Check for overly casual language
  const casualPhrases = ['gonna', 'wanna', 'kinda', 'sorta', 'yeah', 'yep'];
  casualPhrases.forEach(phrase => {
    if (lowerText.includes(phrase)) {
      issues.push({
        type: 'warning',
        category: 'tone',
        message: `Avoid casual language: "${phrase}"`,
        suggestion: 'Use more formal language in professional documents'
      });
    }
  });
  
  // Check for first person in resume
  const firstPersonPronouns = ['i ', 'me ', 'my ', 'mine'];
  if (firstPersonPronouns.some(pronoun => lowerText.includes(pronoun))) {
    issues.push({
      type: 'suggestion',
      category: 'tone',
      message: 'Resume contains first-person pronouns',
      suggestion: 'Consider using action verbs instead of "I" statements'
    });
  }
  
  return issues;
};

// Comprehensive validation
export const validateDocument = (
  text: string,
  type: 'resume' | 'cover-letter'
): ValidationResult => {
  const issues: ValidationIssue[] = [
    ...checkSpelling(text),
    ...checkGrammar(text),
    ...checkLength(text, type),
    ...analyzeTone(text)
  ];
  
  const errorCount = issues.filter(i => i.type === 'error').length;
  const warningCount = issues.filter(i => i.type === 'warning').length;
  
  // Calculate score (100 - deductions)
  const score = Math.max(0, 100 - (errorCount * 10) - (warningCount * 5));
  
  const words = text.split(/\s+/).filter(w => w.length > 0);
  
  return {
    isValid: errorCount === 0,
    issues,
    score,
    readabilityScore: calculateReadability(text),
    wordCount: words.length,
    characterCount: text.length
  };
};