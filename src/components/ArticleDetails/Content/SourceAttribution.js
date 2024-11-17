import React from 'react';
import { FaExternalLinkAlt, FaGlobe } from 'react-icons/fa';
import { motion } from 'framer-motion';

const SourceAttribution = ({ url }) => {
  const getDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch (e) {
      return url;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg p-3 mb-4 border border-gray-100"
    >
      <div className="space-y-2">
        {/* Source Website */}
        <div className="flex items-center text-gray-600 mb-2">
          <FaGlobe className="w-4 h-4 mr-2 text-blue-500" />
          <span className="font-medium">{getDomain(url)}</span>
        </div>

        {/* Original Link */}
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-blue-500 hover:text-blue-600 transition-colors text-sm"
        >
          <FaExternalLinkAlt className="w-3 h-3 mr-2" />
          <span>View Original</span>
        </a>
      </div>
    </motion.div>
  );
};

export default SourceAttribution;
