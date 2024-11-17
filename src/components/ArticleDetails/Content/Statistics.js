import React, { useEffect, useState } from 'react';
import { analyzeText } from '../../../utils/textAnalysisUtils';
import { FaBook, FaClock, FaChartBar, FaSmile } from 'react-icons/fa';
import { motion } from 'framer-motion';

const Statistics = ({ content }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (content) {
      const analysis = analyzeText(content);
      setStats(analysis);
    }
  }, [content]);

  if (!stats) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 p-4"
    >
      {/* Basic Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={<FaBook />}
          label="Words"
          value={stats.basicStats.wordCount.toLocaleString()}
        />
        <StatCard
          icon={<FaClock />}
          label="Reading Time"
          value={`${stats.basicStats.readingTime} min`}
        />
        <StatCard
          icon={<FaChartBar />}
          label="Readability"
          value={stats.readability.level}
        />
        <StatCard
          icon={<FaSmile />}
          label="Sentiment"
          value={stats.sentiment.emotion}
          color={getSentimentColor(stats.sentiment.score)}
        />
      </div>

      {/* Word Frequency */}
      <div className="bg-white rounded-lg p-4 shadow-sm">
        <h3 className="text-lg font-semibold mb-3">Top Words</h3>
        <div className="grid grid-cols-2 gap-4">
          {stats.topWords.map(([word, count], index) => (
            <div
              key={word}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <span className="font-medium">{word}</span>
              <span className="text-gray-500">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Content Structure</h3>
          <div className="space-y-2">
            <DetailRow label="Sentences" value={stats.basicStats.sentenceCount} />
            <DetailRow label="Paragraphs" value={stats.basicStats.paragraphCount} />
            <DetailRow
              label="Characters"
              value={stats.basicStats.characterCount.toLocaleString()}
            />
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 shadow-sm">
          <h3 className="text-lg font-semibold mb-3">Readability Analysis</h3>
          <div className="space-y-2">
            <DetailRow
              label="Score"
              value={`${stats.readability.score}/100`}
            />
            <DetailRow
              label="Level"
              value={stats.readability.level}
            />
            <DetailRow
              label="Sentiment Score"
              value={`${Math.round(stats.sentiment.normalizedScore * 100)}%`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-white p-4 rounded-lg shadow-sm">
    <div className="flex items-center space-x-3">
      <div className={`text-lg ${color || 'text-blue-500'}`}>{icon}</div>
      <div>
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  </div>
);

const DetailRow = ({ label, value }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-gray-600">{label}</span>
    <span className="font-medium">{value}</span>
  </div>
);

const getSentimentColor = (score) => {
  if (score > 0) return 'text-green-500';
  if (score < 0) return 'text-red-500';
  return 'text-gray-500';
};

export default Statistics;
