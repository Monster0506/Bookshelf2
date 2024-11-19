import { extractInsightsWithAI } from './aiUtils';

/**
 * Advanced key takeaways extraction with categorization and scoring
 */

// Patterns to identify important sentences
const IMPORTANCE_PATTERNS = {
  CONCLUSION: /in\s+conclusion|to\s+summarize|therefore|thus|finally|ultimately|in\s+summary|henceforth|as\s+such|overall/i,
  DEFINITION: /is\s+defined\s+as|refers\s+to|means|is\s+characterized\s+by|can\s+be\s+described\s+as|denotes|signifies/i,
  IMPACT: /significant|crucial|critical|important|essential|key|major|fundamental|vital|pivotal|paramount|indispensable|noteworthy/i,
  COMPARISON: /compared\s+to|in\s+contrast|however|unlike|whereas|while|on\s+the\s+other\s+hand|similarly|in\s+comparison|by\s+contrast/i,
  CAUSATION: /because|due\s+to|as\s+a\s+result|consequently|hence|leads\s+to|therefore|results\s+in|owing\s+to|follows\s+that|on\s+account\s+of/i,
  FINDING: /found\s+that|discovered|reveals|shows|demonstrates|indicates|proves|validates|evidence\s+suggests|illustrates/i,
  STATISTIC: /\d+%|\d+\s*percent|increased|decreased|reduced|improved|growth\s+of\s+\d+|decline\s+of\s+\d+|average\s+of|median\s+of|range\s+from|standard\s+deviation|trend\s+indicates/i,
  RECOMMENDATION: /should|must|recommend|suggest|propose|advise|consider|urge|encourage|call\s+for|emphasize|prioritize|advocate/i,
  MAIN_POINT: /primarily|mainly|essentially|fundamentally|notably|remarkably|significantly|centrally|principally|chiefly|most\s+importantly|key\s+point|main\s+point|central\s+idea|core\s+concept|primary\s+focus/i,
  CONTENT_OVERVIEW: /content\s+overview|content\s+summary|content\s+outline|content\s+structure|content\s+organization/i
};

// Categories for organization
const CATEGORIES = {
  MAIN_POINTS: 'Main Points',
  KEY_FINDINGS: 'Key Findings',
  INSIGHTS: 'Insights',
  RECOMMENDATIONS: 'Recommendations',
  TECHNICAL_DETAILS: 'Technical Details'
};

/**
 * Score a sentence based on importance patterns
 */
const scoreSentence = (sentence) => {
  let score = 0;
  const normalizedSentence = sentence.toLowerCase().trim();

  // Pattern-based scoring
  Object.values(IMPORTANCE_PATTERNS).forEach(pattern => {
    if (pattern.test(normalizedSentence)) {
      score += 1;
    }
  });

  // Length-based scoring (prefer medium-length sentences)
  const wordCount = normalizedSentence.split(/\s+/).length;
  if (wordCount >= 10 && wordCount <= 30) score += 1;

  // Position-based scoring (sentences at the start of paragraphs often contain main points)
  if (/^[A-Z]/.test(sentence)) {
    score += 0.5;
  }

  return score;
};

/**
 * Categorize a sentence based on its content
 */
const categorizeSentence = (sentence, score) => {
  const normalizedSentence = sentence.toLowerCase();

  // Main points get priority
  if (score >= 2 || IMPORTANCE_PATTERNS.MAIN_POINT.test(normalizedSentence)) {
    return CATEGORIES.MAIN_POINTS;
  }

  // Check for findings
  if (IMPORTANCE_PATTERNS.FINDING.test(normalizedSentence) || 
      IMPORTANCE_PATTERNS.STATISTIC.test(normalizedSentence)) {
    return CATEGORIES.KEY_FINDINGS;
  }

  // Check for recommendations
  if (IMPORTANCE_PATTERNS.RECOMMENDATION.test(normalizedSentence)) {
    return CATEGORIES.RECOMMENDATIONS;
  }

  // Check for insights
  if (IMPORTANCE_PATTERNS.IMPACT.test(normalizedSentence) || 
      IMPORTANCE_PATTERNS.CONCLUSION.test(normalizedSentence)) {
    return CATEGORIES.INSIGHTS;
  }

  // Check for content overview
  if (IMPORTANCE_PATTERNS.CONTENT_OVERVIEW.test(normalizedSentence)) {
    return CATEGORIES.MAIN_POINTS;
  }

  // Default to technical details
  return CATEGORIES.TECHNICAL_DETAILS;
};

/**
 * Extract key takeaways using rule-based approach
 */
export const extractKeyTakeaways = (text) => {
  console.log('Starting rule-based extraction');
  
  if (!text) {
    console.log('No text provided');
    return {};
  }

  try {
    // Split text into sentences
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    console.log(`Found ${sentences.length} sentences`);

    if (sentences.length === 0) {
      console.log('No sentences found');
      return {};
    }

    // Initialize results
    const results = {};
    Object.values(CATEGORIES).forEach(category => {
      results[category] = [];
    });

    // Process each sentence
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      const score = scoreSentence(trimmedSentence);
      
      // Only include sentences with a score > 0
      if (score > 0) {
        const category = categorizeSentence(trimmedSentence, score);
        // console.log(`Categorized sentence ${index + 1}:`, { 
        //   category, 
        //   score, 
        //   sentence: trimmedSentence.substring(0, 50) + '...' 
        // });
        
        if (!results[category].includes(trimmedSentence)) {
          results[category].push(trimmedSentence);
        }
      }
    });

    // Remove empty categories and limit results
    Object.keys(results).forEach(category => {
      if (results[category].length === 0) {
        delete results[category];
      } else {
        // Limit to top 5 items per category
        results[category] = results[category].slice(0, 5);
      }
    });

    console.log('Final takeaways:', results);
    return results;
  } catch (error) {
    console.error('Error extracting takeaways:', error);
    return {};
  }
};
