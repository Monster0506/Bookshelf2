import React from "react";
import { Link } from "react-router-dom";
import { FaEllipsisV } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/ArticleCard.css"; // Custom CSS for additional animations

function ArticleCard({
  article,
  handleContextMenuToggle,
  contextMenu,
  toggleArticleStatus,
  archiveArticle,
  deleteArticle,
  currentUser,
  handleShare,
  handleTagClick,
}) {
  // Calculate if the article is new (e.g., added within the last 7 days)
  const isNew = () => {
    const articleDate = article.date.toDate();
    const today = new Date();
    const diffTime = Math.abs(today - articleDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  return (
    <motion.div
      key={article.id}
      className={`relative p-6 border border-gray-200 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-500 ease-in-out ${
        article.status === "READ" ? "bg-gray-100" : "bg-white"
      }`}
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 30, scale: 0.9 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      whileHover={{ scale: 1.03 }}
    >
      {isNew() && (
        <div className="absolute top-0 left-0 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-br-lg">
          New
        </div>
      )}

      <div>
        <Link to={`/articles/${article.id}`}>
          <motion.h2
            className="text-2xl font-semibold mb-2 text-gray-800"
            whileHover={{ x: 10 }}
            transition={{ duration: 0.4 }}
          >
            {article.title}
          </motion.h2>
          <motion.div
            className="mb-2 text-gray-500 truncate"
            whileHover={{ color: "#1E90FF" }}
            transition={{ duration: 0.4 }}
          >
            {article.source.length > 43
              ? `${article.source.substring(0, 40)}...`
              : article.source}
          </motion.div>
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {Array.isArray(article.tags) &&
          article.tags.map((tag, index) => (
            <motion.span
              key={index}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full cursor-pointer shadow-md"
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.3 }}
              onClick={(e) => {
                e.stopPropagation();
                handleTagClick(tag);
              }}
            >
              {tag}
            </motion.span>
          ))}
      </div>

      <div className="text-gray-600 mb-2">
        <Link to={`/articles/${article.id}`}>
          <motion.p
            className="mb-1"
            whileHover={{ x: 5 }}
            transition={{ duration: 0.3 }}
          >
            Reading Time:{" "}
            <span className="font-medium">{article.read.minutes || "N/A"}</span>
          </motion.p>
        </Link>
      </div>

      {/* Context Menu with Animation */}
      <div className="absolute top-2 right-2">
        <div className="relative inline-block text-left">
          <motion.button
            className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200 ease-in-out"
            aria-haspopup="true"
            aria-expanded="true"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenuToggle(article.id);
            }}
            animate={{ rotate: contextMenu === article.id ? 90 : 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            whileHover={{ rotate: contextMenu === article.id ? 90 : 20 }}
          >
            <FaEllipsisV />
          </motion.button>
          <AnimatePresence>
            {contextMenu === article.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div
                  className="py-1"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleArticleStatus(article.id, article.status);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 ease-in-out w-full text-left"
                  >
                    {article.status === "UNREAD"
                      ? "Mark as Read"
                      : "Mark as Unread"}
                  </button>
                  {article.userid === currentUser.uid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        archiveArticle(article.id, article.archived);
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 ease-in-out w-full text-left"
                    >
                      {article.archived ? "Unarchive" : "Archive"}
                    </button>
                  )}
                  <button
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200 ease-in-out w-full text-left"
                    type="button"
                    onClick={() => handleShare(article.id)}
                  >
                    Share
                  </button>
                  {article.userid === currentUser.uid && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteArticle(article.id);
                      }}
                      className="block px-4 py-2 text-sm text-red-700 hover:bg-red-100 transition-colors duration-200 ease-in-out w-full text-left"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export default ArticleCard;
