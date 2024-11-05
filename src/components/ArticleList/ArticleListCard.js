import React, { useState } from "react";
import { motion } from "framer-motion";
import "../../css/ArticleCard.css"; // Custom CSS for additional animations
function ArticleListCard({
  article,
  archiveArticle,
  deleteArticle,
  handleShare,
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-gray-900">{article.title}</h2>
      </div>
      <p className="text-sm text-gray-500 mb-2 italic">{article.source}</p>
      <p className="text-base text-gray-700 mb-4 leading-relaxed">
        {article.summary || "No summary available."}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <motion.button
            onClick={() => handleShare(article.id)}
            className="px-5 py-2 rounded-lg flex items-center bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
            whileHover={{ scale: 1.05 }}
          >
            Share
          </motion.button>
          <motion.button
            onClick={() => archiveArticle(article.id, article.archived)}
            className="px-5 py-2 rounded-lg flex items-center bg-yellow-500 text-white hover:bg-yellow-600 shadow-md transition-all"
            whileHover={{ scale: 1.05 }}
          >
            {article.archived ? "Unarchive" : "Archive"}
          </motion.button>
          <motion.button
            onClick={() => deleteArticle(article.id)}
            className="px-5 py-2 rounded-lg flex items-center bg-red-600 text-white hover:bg-red-700 shadow-md transition-all"
            whileHover={{ scale: 1.05 }}
          >
            Delete
          </motion.button>
        </div>
        <span className="text-sm text-gray-400">
          {article.date.toDate().toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}

export default ArticleListCard;
