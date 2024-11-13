import React from "react";
import { Link } from "react-router-dom";
import "../../css/ArticleCard.css"; // Ensure CSS matches the new design

function ArticleListCard({
  article,
  archiveArticle,
  deleteArticle,
  handleShare,
  handleTagClick,
}) {
  return (
    <div className="bg-white border rounded-lg shadow-lg p-6 mb-4 transition hover:shadow-xl">
      <Link to={`/articles/${article.id}`} className="block">
        {/* Title Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-800 truncate">
            {article.title}
          </h2>
          <span className="text-sm text-gray-400">
            {article.date.toDate().toLocaleDateString()}
          </span>
        </div>

        {/* Source Section */}
        <p className="text-sm text-gray-500 italic mb-3">
          {article.source || "Unknown source"}
        </p>

        {/* Summary Section */}
        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
          {article.summary || "No summary available."}
        </p>

        {/* Tags Section */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex gap-2 overflow-x-auto mb-4">
            {article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-full border whitespace-nowrap"
                onClick={(e) => {
                  e.stopPropagation();
                  handleTagClick(tag);
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              onClick={() => handleShare(article.id)}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring focus:ring-blue-300"
            >
              Share
            </button>
            <button
              onClick={() => archiveArticle(article.id, article.archived)}
              className="px-4 py-2 rounded-lg bg-yellow-500 text-white hover:bg-yellow-600 focus:outline-none focus:ring focus:ring-yellow-300"
            >
              {article.archived ? "Unarchive" : "Archive"}
            </button>
            <button
              onClick={() => deleteArticle(article.id)}
              className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring focus:ring-red-300"
            >
              Delete
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ArticleListCard;
