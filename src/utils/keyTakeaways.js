import { extractInsightsWithAI, categorizeText } from './aiUtils';

/**
 * Advanced key takeaways extraction with categorization and scoring
 */

// Patterns that indicate important information
const IMPORTANCE_PATTERNS = {
  CONCLUSION: /in\s+conclusion|to\s+summarize|therefore|thus|finally|ultimately|in\s+summary|henceforth|as\s+such|overall/i,
  DEFINITION: /is\s+defined\s+as|refers\s+to|means|is\s+characterized\s+by|can\s+be\s+described\s+as|denotes|signifies/i,
  IMPACT: /significant|crucial|critical|important|essential|key|major|fundamental|vital|pivotal|paramount|indispensable|noteworthy/i,
  COMPARISON: /compared\s+to|in\s+contrast|however|unlike|whereas|while|on\s+the\s+other\s+hand|similarly|in\s+comparison|by\s+contrast/i,
  CAUSATION: /because|due\s+to|as\s+a\s+result|consequently|hence|leads\s+to|therefore|results\s+in|owing\s+to|follows\s+that|on\s+account\s+of/i,
  FINDING: /found\s+that|discovered|reveals|shows|demonstrates|indicates|proves|validates|evidence\s+suggests|illustrates/i,
  STATISTIC: /\d+%|\d+\s*percent|increased|decreased|reduced|improved|growth\s+of\s+\d+|decline\s+of\s+\d+|average\s+of|median\s+of|range\s+from|standard\s+deviation|trend\s+indicates/i,
  RECOMMENDATION: /should|must|recommend|suggest|propose|advise|consider|urge|encourage|call\s+for|emphasize|prioritize|advocate/i,
  MAIN_POINT: /primarily|mainly|essentially|fundamentally|notably|remarkably|significantly|centrally|principally|chiefly|most\s+importantly|key\s+point|main\s+point|central\s+idea|core\s+concept|primary\s+focus/i
};

// Structural indicators for main points
const STRUCTURAL_INDICATORS = {
  ENUMERATION: /^(first(ly)?|second(ly)?|third(ly)?|fourth(ly)?|fifth(ly)?|finally|lastly|next|then|subsequently)/i,
  EMPHASIS: /^(notably|importantly|specifically|particularly|especially|significantly|remarkably|crucially)/i,
  TOPIC_INTRO: /^(regarding|concerning|with\s+respect\s+to|in\s+terms\s+of|as\s+for|speaking\s+of|on\s+the\s+topic\s+of)/i,
  MAIN_IDEA: /^(the\s+main|the\s+primary|the\s+central|the\s+key|the\s+core|the\s+essential|the\s+fundamental)/i
};

// Categories for takeaways
const CATEGORIES = {
  MAIN_POINTS: 'Main Points',
  KEY_FINDINGS: 'Key Findings',
  INSIGHTS: 'Insights',
  RECOMMENDATIONS: 'Recommendations',
  DEFINITIONS: 'Definitions',
  IMPACT: 'Impact',
  COMPARISONS: 'Comparisons',
  CAUSATION: 'Causation',
  STATISTICS: 'Statistics'
};

/**
 * Score a sentence based on various factors
 */
const scoreSentence = (sentence) => {
  let score = 0;
  const normalizedSentence = sentence.trim();

  // Pattern-based scoring
  Object.values(IMPORTANCE_PATTERNS).forEach(pattern => {
    if (pattern.test(normalizedSentence)) {
      score += 1;
    }
  });

  // Structural scoring with higher weights for main point indicators
  Object.values(STRUCTURAL_INDICATORS).forEach(pattern => {
    if (pattern.test(normalizedSentence)) {
      score += 2; // Higher weight for structural indicators
    }
  });

  // Position-based scoring (sentences at the start of paragraphs often contain main points)
  if (/^[A-Z]/.test(normalizedSentence)) {
    score += 0.5;
  }

  // Content-based scoring
  if (/\d/.test(normalizedSentence)) score += 1; // Contains numbers
  if (/"[^"]*"/.test(normalizedSentence)) score += 1; // Contains quotes
  if (/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+/.test(normalizedSentence)) score += 1; // Contains proper nouns

  // Length-based scoring (prefer medium-length sentences for main points)
  const wordCount = normalizedSentence.split(/\s+/).length;
  if (wordCount >= 10 && wordCount <= 30) score += 1;
  if (wordCount > 30) score -= 0.5;
  if (wordCount < 10) score -= 0.5;

  // Bonus for sentences that combine multiple indicators
  const indicatorCount = Object.values(IMPORTANCE_PATTERNS).filter(pattern => 
    pattern.test(normalizedSentence)
  ).length;
  if (indicatorCount > 1) score += indicatorCount * 0.5;

  return score;
};

/**
 * Check if a sentence is likely to be a main point
 */
const isMainPoint = (sentence) => {
  // Check for explicit main point indicators
  if (IMPORTANCE_PATTERNS.MAIN_POINT.test(sentence)) return true;

  // Check for structural indicators
  const hasStructuralIndicator = Object.values(STRUCTURAL_INDICATORS)
    .some(pattern => pattern.test(sentence));
  if (hasStructuralIndicator) return true;

  // Check for topic sentences (often contain subject + strong verb)
  const topicSentencePattern = /^(This|The|These|Those|It)\s+[a-z]+s?\s+(is|are|was|were|has|have|demonstrates|shows|proves|indicates|suggests)/i;
  if (topicSentencePattern.test(sentence)) return true;

  // Check for sentences that introduce key concepts
  const conceptIntroPattern = /(introduces|presents|outlines|describes|explains|discusses|addresses|focuses\s+on|deals\s+with|explores|examines|analyzes)/i;
  if (conceptIntroPattern.test(sentence)) return true;

  return false;
};

/**
 * Categorize a takeaway based on its content
 */
const categorizeTakeaway = (sentence, score) => {
  // Check if it's a main point first
  if (isMainPoint(sentence) || score >= 4) {
    return CATEGORIES.MAIN_POINTS;
  }

  // Check for statistics first as they often contain numbers
  if (IMPORTANCE_PATTERNS.STATISTIC.test(sentence)) {
    return CATEGORIES.STATISTICS;
  }
  
  // Check for definitions
  if (IMPORTANCE_PATTERNS.DEFINITION.test(sentence)) {
    return CATEGORIES.DEFINITIONS;
  }
  
  // Check for impact statements
  if (IMPORTANCE_PATTERNS.IMPACT.test(sentence)) {
    return CATEGORIES.IMPACT;
  }
  
  // Check for comparisons
  if (IMPORTANCE_PATTERNS.COMPARISON.test(sentence)) {
    return CATEGORIES.COMPARISONS;
  }
  
  // Check for causation
  if (IMPORTANCE_PATTERNS.CAUSATION.test(sentence)) {
    return CATEGORIES.CAUSATION;
  }
  
  // Check for findings
  if (IMPORTANCE_PATTERNS.FINDING.test(sentence)) {
    return CATEGORIES.KEY_FINDINGS;
  }
  
  // Check for recommendations
  if (IMPORTANCE_PATTERNS.RECOMMENDATION.test(sentence)) {
    return CATEGORIES.RECOMMENDATIONS;
  }
  
  // Check for insights (if it has conclusion patterns but doesn't fit other categories)
  if (IMPORTANCE_PATTERNS.CONCLUSION.test(sentence)) {
    return CATEGORIES.INSIGHTS;
  }
  
  // If it has a high score but doesn't fit other categories, it might be a main point
  if (score >= 3) {
    return CATEGORIES.MAIN_POINTS;
  }

  // Default to insights if no specific category is matched
  return CATEGORIES.INSIGHTS;
};

/**
 * Extract and categorize key takeaways from text
 */
const extractKeyTakeawaysRuleBased = (text) => {
  // Split text into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  
  // Score and filter sentences
  const scoredSentences = sentences
    .map(sentence => ({
      text: sentence.trim(),
      score: scoreSentence(sentence)
    }))
    .filter(({ score }) => score > 1)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(sentences.length, 25)); // Increased limit for better coverage

  // Categorize takeaways
  const categorizedTakeaways = {};
  Object.values(CATEGORIES).forEach(category => {
    categorizedTakeaways[category] = [];
  });

  // First pass: categorize high-scoring sentences and main points
  scoredSentences.forEach(({ text, score }) => {
    if (score >= 3 || isMainPoint(text)) {
      const category = categorizeTakeaway(text, score);
      if (categorizedTakeaways[category].length < 5) {
        categorizedTakeaways[category].push(text);
      }
    }
  });

  // Second pass: fill remaining categories
  scoredSentences.forEach(({ text, score }) => {
    if (score < 3) {
      const category = categorizeTakeaway(text, score);
      if (categorizedTakeaways[category].length < 5) {
        categorizedTakeaways[category].push(text);
      }
    }
  });

  // Remove empty categories
  Object.keys(categorizedTakeaways).forEach(category => {
    if (categorizedTakeaways[category].length === 0) {
      delete categorizedTakeaways[category];
    }
  });

  return categorizedTakeaways;
};

/**
 * Extract key takeaways from text using either AI or rule-based approach
 * @param {string} text - The text to analyze
 * @param {boolean} useAI - Whether to use AI-powered extraction
 * @returns {Promise<Object>} Categorized takeaways
 */
export const extractKeyTakeaways = async (text, useAI = true) => {
    if (!text || typeof text !== 'string') {
        console.warn('Invalid input for takeaways extraction');
        return {};
    }

    try {
        if (useAI) {
            console.log('Using AI-powered extraction...');
            return await extractInsightsWithAI(text);
        } else {
            console.log('Using rule-based extraction...');
            return await extractRuleBasedTakeaways(text);
        }
    } catch (error) {
        console.error('Error extracting takeaways:', error);
        console.log('Falling back to rule-based extraction...');
        return await extractRuleBasedTakeaways(text);
    }
};

/**
 * Extract takeaways using rule-based approach
 * @param {string} text - The text to analyze
 * @returns {Promise<Object>} Categorized takeaways
 */
const extractRuleBasedTakeaways = async (text) => {
    try {
        // Use the same categorization logic but with simpler text preprocessing
        const cleanedText = text
            .replace(/\s+/g, ' ')
            .replace(/\n+/g, '. ')
            .trim();

        // Split into more manageable chunks
        const chunks = cleanedText.split(/(?<=[.!?])\s+/);
        const processedText = chunks
            .filter(chunk => chunk.length > 20) // Only process meaningful chunks
            .join('. ');

        // Use the same categorization function from aiUtils
        const takeaways = await categorizeText(processedText);

        // Clean up and limit results
        const cleanedTakeaways = {};
        Object.entries(takeaways).forEach(([category, items]) => {
            const uniqueItems = [...new Set(items)]
                .filter(item => item && typeof item === 'string' && item.trim().length > 20)
                .slice(0, 3);  // Limit to top 3 per category

            if (uniqueItems.length > 0) {
                cleanedTakeaways[category] = uniqueItems;
            }
        });

        return cleanedTakeaways;
    } catch (error) {
        console.error('Error in rule-based extraction:', error);
        return {};
    }
};
