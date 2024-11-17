import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import nlp from 'compromise';
import stopwords from 'stopwords-en';
import vader from 'vader-sentiment';
import {
  faBook,
  faFont,
  faClock,
  faParagraph,
  faRulerHorizontal,
  faChartBar,
  faFaceSmile,
  faFaceFrown,
  faGauge
} from '@fortawesome/free-solid-svg-icons';

// Create a Set for faster lookup
const stopWordsSet = new Set(stopwords);

// Function to clean text
const cleanText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove non-alphanumeric characters
    .split(/\s+/)
    // .filter(word => !stopWordsSet.has(word)) // Remove stopwords
    .join(' ');
};

const StatItem = ({ icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
  >
    <div className="text-blue-500 text-xl">
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </motion.div>
);

const WordFrequencyItem = ({ word, count, index }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.3, delay: index * 0.1 }}
    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded transition-colors"
  >
    <span className="font-medium text-gray-700">{word}</span>
    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
      {count}
    </span>
  </motion.div>
);

const SentimentGauge = ({ score }) => {
  // Convert score from [-5, 5] range to [-1, 1] range
  const normalizedScore = Math.max(-1, Math.min(1, score / 5));
  const percentage = ((normalizedScore + 1) / 2) * 100;
  const color = normalizedScore > 0 ? 'text-green-500' : normalizedScore < 0 ? 'text-red-500' : 'text-gray-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center p-4"
    >
      <div className={`text-4xl mb-2 ${color}`}>
        <FontAwesomeIcon icon={normalizedScore > 0 ? faFaceSmile : faFaceFrown} />
      </div>
      <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full ${normalizedScore > 0 ? 'bg-green-500' : 'bg-red-500'}`}
        />
      </div>
      <p className="mt-2 font-semibold text-gray-700">
        Sentiment Score: {normalizedScore.toFixed(2)}
      </p>
    </motion.div>
  );
};

const ArticleStats = ({ article }) => {
  const stats = useMemo(() => {
    if (!article?.plaintext) return null;

    const text = article.plaintext;
    const cleanedText = cleanText(text);
    
    // Basic stats (use original text for these)
    const words = text.trim().split(/\s+/);
    const wordCount = words.length;
    const charCount = text.length;
    const readingTime = Math.ceil(wordCount / 200);
    const sentenceCount = text.split(/[.!?]+/).filter(Boolean).length;
    const avgWordLength = (charCount / wordCount).toFixed(1);

    // Word frequency (use cleaned text)
    const cleanedWords = cleanedText.split(/\s+/);
    const wordFrequency = cleanedWords
      .filter(word => word.length > 3)
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {});

    const topWords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    // Sentiment analysis using VADER
    const intensity = vader.SentimentIntensityAnalyzer.polarity_scores(text);
    const sentimentScore = intensity.compound; // compound score is between -1 and 1

    return {
      wordCount,
      charCount,
      readingTime,
      topWords,
      sentenceCount,
      avgWordLength,
      sentimentScore
    };
  }, [article?.plaintext]);

  if (!stats) return (
    <div className="p-8 text-center text-gray-500">
      <FontAwesomeIcon icon={faBook} className="text-4xl mb-4" />
      <p>No content available for analysis</p>
    </div>
  );

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Basic Statistics */}
        <motion.div
          initial={{ x: -50 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faChartBar} className="text-blue-500" />
            Basic Statistics
          </h2>
          <div className="grid gap-4">
            <StatItem icon={faBook} label="Words" value={stats.wordCount.toLocaleString()} />
            <StatItem icon={faFont} label="Characters" value={stats.charCount.toLocaleString()} />
            <StatItem icon={faParagraph} label="Sentences" value={stats.sentenceCount.toLocaleString()} />
            <StatItem icon={faRulerHorizontal} label="Average Word Length" value={`${stats.avgWordLength} characters`} />
            <StatItem icon={faClock} label="Estimated Reading Time" value={`${stats.readingTime} minute${stats.readingTime !== 1 ? 's' : ''}`} />
          </div>
        </motion.div>

        {/* Sentiment Analysis */}
        <motion.div
          initial={{ x: 50 }}
          animate={{ x: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faGauge} className="text-blue-500" />
            Sentiment Analysis
          </h2>
          <SentimentGauge score={stats.sentimentScore} />
        </motion.div>

        {/* Word Frequency */}
        <motion.div
          initial={{ y: 50 }}
          animate={{ y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-md p-6 md:col-span-2"
        >
          <h2 className="text-xl font-bold mb-4 text-gray-800 flex items-center gap-2">
            <FontAwesomeIcon icon={faFont} className="text-blue-500" />
            Most Common Words
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {stats.topWords.map(([word, count], index) => (
              <WordFrequencyItem
                key={word}
                word={word}
                count={count}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ArticleStats;
