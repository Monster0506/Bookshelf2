// Browser-compatible text analysis utilities
export const analyzeText = (text) => {
  if (!text) return null;

  // Basic stats
  const words = text.trim().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const paragraphs = text.split('\n\n').filter(Boolean);
  const characters = text.length;
  const readingTime = Math.ceil(words.length / 200); // Average reading speed: 200 words/minute

  // Word frequency (excluding common words)
  const commonWords = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what'
  ]);

  const wordFrequency = {};
  words.forEach(word => {
    const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized && !commonWords.has(normalized)) {
      wordFrequency[normalized] = (wordFrequency[normalized] || 0) + 1;
    }
  });

  const topWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  // Simple sentiment analysis
  const positiveWords = new Set([
    'good', 'great', 'awesome', 'excellent', 'happy', 'best', 'love',
    'wonderful', 'fantastic', 'amazing', 'beautiful', 'perfect', 'better',
    'positive', 'success', 'successful', 'win', 'winning'
  ]);

  const negativeWords = new Set([
    'bad', 'worst', 'terrible', 'awful', 'horrible', 'wrong', 'hate',
    'problem', 'difficult', 'negative', 'fail', 'failing', 'failed',
    'poor', 'disappointing', 'disappointed', 'waste', 'worse'
  ]);

  let sentimentScore = 0;
  words.forEach(word => {
    const normalized = word.toLowerCase();
    if (positiveWords.has(normalized)) sentimentScore++;
    if (negativeWords.has(normalized)) sentimentScore--;
  });

  // Normalize sentiment score to -5 to 5 range
  const normalizedSentiment = Math.max(-5, Math.min(5, sentimentScore));

  // Simple readability score based on average words per sentence
  const wordsPerSentence = words.length / sentences.length;
  const readabilityScore = Math.max(0, Math.min(100, 100 - (wordsPerSentence - 10) * 5));

  return {
    basicStats: {
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      characterCount: characters,
      readingTime,
    },
    topWords,
    sentiment: {
      score: normalizedSentiment,
      normalizedScore: (normalizedSentiment + 5) / 10,
      emotion: normalizedSentiment > 0 ? 'Positive' : normalizedSentiment < 0 ? 'Negative' : 'Neutral',
    },
    readability: {
      score: Math.round(readabilityScore),
      level: getReadabilityLevel(readabilityScore),
    }
  };
};

const getReadabilityLevel = (score) => {
  if (score >= 90) return 'Very Easy';
  if (score >= 80) return 'Easy';
  if (score >= 70) return 'Fairly Easy';
  if (score >= 60) return 'Standard';
  if (score >= 50) return 'Fairly Difficult';
  if (score >= 30) return 'Difficult';
  return 'Very Difficult';
};
