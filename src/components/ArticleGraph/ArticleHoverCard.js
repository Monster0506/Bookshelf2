import React, { useEffect, useState } from 'react';
import { FaTimes, FaCalendar, FaTags, FaExternalLinkAlt } from 'react-icons/fa';

const ArticleHoverCard = ({ article, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (article) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [article]);

  if (!article) return null;

  const handleDismiss = (e) => {
    e.stopPropagation();
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 300);
  };

  return (
    <div
      className={`fixed bottom-6 left-6 right-6 max-w-3xl mx-auto p-6 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 rounded-lg shadow-2xl z-50 transform transition-all duration-300 ease-in-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}
        ${isHovered ? 'scale-[1.02]' : 'scale-100'}
        hover:shadow-blue-900/20`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleDismiss}
    >
      <div className="relative">
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute -top-3 -right-3 p-2 bg-gray-700 hover:bg-gray-600 rounded-full text-gray-300 hover:text-white transform transition-all duration-200 hover:scale-110"
        >
          <FaTimes size={14} />
        </button>

        {/* Title */}
        <h3 className="text-2xl font-extrabold text-white mb-3 leading-tight pr-8">
          {article.title || article.name}
        </h3>

        {/* Metadata row */}
        <div className="flex items-center gap-4 mb-3 text-sm text-gray-400">
          {article.date && (
            <div className="flex items-center gap-1">
              <FaCalendar className="text-blue-400" size={12} />
              <span>{article.date.toDate().toLocaleDateString()}</span>
            </div>
          )}
          {article.source && (
            <a
              href={article.source}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
              onClick={e => e.stopPropagation()}
            >
              <FaExternalLinkAlt size={12} />
              <span>View Source</span>
            </a>
          )}
        </div>



        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap mt-2">
            <FaTags className="text-blue-400" size={12} />
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-600/50 text-gray-300 text-xs rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticleHoverCard;
