import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FaClock, FaBook, FaCalendar, FaShare, FaArchive, FaTrash } from "react-icons/fa";
import "../../css/ArticleCard.css";

function ArticleListCard({
  article,
  archiveArticle,
  deleteArticle,
  handleShare,
  handleTagClick,
}) {
  const isNew = () => {
    const articleDate = article.date.toDate();
    const today = new Date();
    const diffTime = Math.abs(today - articleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  return (
    <motion.div
      className={`relative bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 mb-4 overflow-hidden ${
        article.status === "READ" ? "bg-opacity-75" : ""
      }`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-start p-6">
        {/* Left Column - Main Content */}
        <div className="flex-grow">
          <div className="flex items-center gap-3 mb-2">
            {isNew() && (
              <span className="px-2 py-1 text-xs font-semibold text-green-800 bg-green-100 rounded-full">
                New
              </span>
            )}
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                article.status === "READ"
                  ? "bg-blue-100 text-blue-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {article.status}
            </span>
          </div>

          <Link to={`/articles/${article.id}`}>
            <h2 className="text-xl font-bold text-gray-800 hover:text-blue-600 transition-colors duration-200 mb-2">
              {article.title}
            </h2>
          </Link>

          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {article.source}
          </p>

          <p className="text-sm text-gray-700 mb-4 line-clamp-2">
            {article.summary}
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {article.tags &&
              article.tags.map((tag, index) => (
                <motion.span
                  key={index}
                  className="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full cursor-pointer hover:bg-blue-100 transition-colors duration-200"
                  whileHover={{ scale: 1.05 }}
                  onClick={(e) => {
                    e.preventDefault();
                    handleTagClick(tag);
                  }}
                >
                  {tag}
                </motion.span>
              ))}
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <FaCalendar className="text-gray-400" />
              <span>{article.date.toDate().toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <FaClock className="text-gray-400" />
              <span>{article.read.minutes} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <FaBook className="text-gray-400" />
              <span>{article.read.words} words</span>
            </div>
          </div>
        </div>

        {/* Right Column - Actions */}
        <div className="flex flex-col gap-2 ml-6">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors duration-200"
            onClick={() => handleShare(article.id)}
          >
            <FaShare />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-full transition-colors duration-200"
            onClick={() => archiveArticle(article.id, article.archived)}
          >
            <FaArchive />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors duration-200"
            onClick={() => deleteArticle(article.id)}
          >
            <FaTrash />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

export default ArticleListCard;
