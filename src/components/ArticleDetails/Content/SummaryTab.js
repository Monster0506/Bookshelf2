import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt, faClock, faCalendarAlt, faTag, faBookmark } from '@fortawesome/free-solid-svg-icons';
import { format } from 'date-fns';

const SummaryItem = ({ icon, label, value }) => (
  <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
    <div className="text-blue-500 text-xl">
      <FontAwesomeIcon icon={icon} />
    </div>
    <div>
      <p className="text-gray-600 text-sm">{label}</p>
      <p className="font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);

const SummaryTab = ({ article, status, tags, createdAt }) => {
  const readingTime = Math.ceil((article?.plaintext?.length || 0) / 1000); // Rough estimate: 200 words per minute, average 5 characters per word

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-6 space-y-6"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <SummaryItem
          icon={faFileAlt}
          label="Word Count"
          value={article?.plaintext ? Math.ceil(article.plaintext.split(/\s+/).length) : 0}
        />
        <SummaryItem
          icon={faClock}
          label="Estimated Reading Time"
          value={`${readingTime} minute${readingTime !== 1 ? 's' : ''}`}
        />
        <SummaryItem
          icon={faCalendarAlt}
          label="Created"
          value={createdAt ? format(new Date(createdAt.seconds * 1000), "PPp") : 'N/A'}
        />
        <SummaryItem
          icon={faBookmark}
          label="Status"
          value={status || 'Unread'}
        />
      </div>

      {/* Tags Section */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <FontAwesomeIcon icon={faTag} className="text-blue-500" />
          Tags
        </h3>
        <div className="flex flex-wrap gap-2">
          {tags?.split(',').map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      </div>

      {/* Summary Section */}
      {article?.summary && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Article Summary</h3>
          <div className="prose max-w-none bg-gray-50 p-6 rounded-lg shadow-sm">
            <p className="text-gray-700 leading-relaxed">{article.summary}</p>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default SummaryTab;
