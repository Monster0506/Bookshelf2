import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FaEllipsisV } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import "../../css/ArticleCard.css"; // Custom CSS for additional animations
const HideTagsAt = 2;

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
  const [showAllTags, setShowAllTags] = useState(false);

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
      className={`relative p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out transform h-full flex flex-col ${
        article.status === "READ" ? "bg-gray-200" : "bg-white"
      }`}
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 50, scale: 0.9 }}
      transition={{ type: "spring", stiffness: 150, damping: 25 }}
      whileHover={{ scale: 1.02 }}
    >
      {isNew() && (
        <div className="absolute top-0 left-0 bg-green-500 text-white text-xs font-semibold px-3 py-1 rounded-br-lg shadow">
          New
        </div>
      )}

      <div className="flex-grow">
        <Link to={`/articles/${article.id}`} className="block">
          <motion.h2
            className="text-3xl font-bold mb-3 text-gray-900 hover:text-blue-600 transition-colors duration-200 line-clamp-2 overflow-hidden"
            whileHover={{ x: 10 }}
            transition={{ type: "spring", stiffness: 160, damping: 12 }}
          >
            {article.title}
          </motion.h2>
          <motion.div
            className="mb-3 text-gray-600 truncate"
            whileHover={{ color: "#2563EB" }}
            transition={{ type: "spring", stiffness: 160, damping: 12 }}
          >
            {article.source.length > 43
              ? `${article.source.substring(0, 40)}...`
              : article.source}
          </motion.div>
        </Link>
      </div>

      {article.folderId && (
        <div className="text-sm text-gray-600 mb-3">
          <span>Folder: </span>
          <Link
            to={`/folders/${article.folderId}`}
            className="text-blue-600 hover:underline"
          >
            {article.folderName || "Unknown Folder"}
          </Link>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        {Array.isArray(article.tags) &&
          article.tags.slice(0, HideTagsAt).map((tag, index) => (
            <motion.span
              key={index}
              className="px-4 py-1 text-sm font-medium text-white bg-blue-600 rounded-full cursor-pointer shadow-md hover:shadow-lg"
              whileHover={{ scale: 1.2 }}
              transition={{ type: "spring", stiffness: 130, damping: 15 }}
              onClick={(e) => {
                e.stopPropagation();
                handleTagClick(tag);
              }}
            >
              {tag}
            </motion.span>
          ))}
        {article.tags.length > HideTagsAt && (
          <button
            onClick={() => setShowAllTags(!showAllTags)}
            className="text-sm text-blue-600 underline focus:outline-none"
          >
            {showAllTags
              ? "Show Less"
              : `+${article.tags.length - HideTagsAt} more`}
          </button>
        )}
        {showAllTags && (
          <div
            className={`absolute top-0 right-0 mt-12 w-40 p-4 ${
              article.status === "READ" ? "bg-gray-200" : "bg-white"
            } border border-gray-300 rounded-lg shadow-lg z-100`}
          >
            {article.tags.slice(HideTagsAt).map((tag, index) => (
              <motion.div
                key={index}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full cursor-pointer mb-2 shadow-md hover:shadow-lg"
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 130, damping: 15 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagClick(tag);
                }}
              >
                {tag}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div className="text-gray-600 mb-3 flex items-center">
        <Link to={`/articles/${article.id}`} className="flex-grow">
          <motion.p
            className="mb-1 hover:text-blue-600 transition-colors duration-200"
            whileHover={{ x: 8 }}
            transition={{ type: "spring", stiffness: 120, damping: 10 }}
          >
            Reading Time:{" "}
            <span className="font-medium">{article.read.minutes || "N/A"}</span>
          </motion.p>
        </Link>
        <div
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            article.status === "READ"
              ? "bg-green-200 text-green-800"
              : "bg-yellow-200 text-yellow-800"
          }`}
        >
          {article.status === "READ" ? "Read" : "Unread"}
        </div>
      </div>

      {/* Context Menu with Animation */}
      <div className="absolute top-3 right-3">
        <div className="relative inline-block text-left">
          <motion.button
            className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors duration-200 ease-in-out"
            aria-haspopup="true"
            aria-expanded="true"
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenuToggle(article.id);
            }}
            animate={{ rotate: contextMenu === article.id ? 90 : 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 18 }}
            whileHover={{ rotate: contextMenu === article.id ? 90 : 20 }}
          >
            <FaEllipsisV />
          </motion.button>
          <AnimatePresence>
            {contextMenu === article.id && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                transition={{ type: "spring", stiffness: 140, damping: 15 }}
                className="origin-top-right absolute right-0 mt-2 w-48 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10"
              >
                <div
                  className="py-2"
                  role="menu"
                  aria-orientation="vertical"
                  aria-labelledby="options-menu"
                >
                  {article.userid === currentUser.uid && (
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
                  )}
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
                      className="block px-4 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors duration-200 ease-in-out w-full text-left"
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
