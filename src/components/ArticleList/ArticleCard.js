// ArticleCard.js
import React from "react";
import { Link } from "react-router-dom";
import { FaEllipsisV } from "react-icons/fa";

function ArticleCard({
  article,
  handleContextMenuToggle,
  contextMenu,
  toggleArticleStatus,
  archiveArticle,
  deleteArticle,
  currentUser,
}) {
  return (
    <div key={article.id} className="relative">
      <Link
        to={`/articles/${article.id}`}
        className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
      >
        <h2 className="text-2xl font-semibold mb-2 text-gray-800">
          {article.title}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{article.source}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags &&
            article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full"
              >
                {tag}
              </span>
            ))}
        </div>

        <div className="text-gray-600 mb-2">
          <p className="mb-1">
            Reading Time:{" "}
            <span className="font-medium">{article.read.minutes || "N/A"}</span>
          </p>
        </div>
      </Link>

      {/* Context Menu */}
      <div className="absolute top-2 right-2">
        <div className="relative inline-block text-left">
          <button
            className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            aria-haspopup="true"
            aria-expanded="true"
            onClick={(e) => {
              e.stopPropagation(); // Prevent link navigation
              handleContextMenuToggle(article.id);
            }}
          >
            <FaEllipsisV />
          </button>
          {contextMenu === article.id && (
            <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
              <div
                className="py-1"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="options-menu"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent link navigation
                    toggleArticleStatus(article.id, article.status);
                  }}
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                >
                  {article.status === "UNREAD"
                    ? "Mark as Read"
                    : "Mark as Unread"}
                </button>
                {/* Show archive option only if the current user is the owner */}
                {article.userid === currentUser.uid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent link navigation
                      archiveArticle(article.id, article.archived);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  >
                    {article.archived ? "Unarchive" : "Archive"}
                  </button>
                )}
                {/* Show delete option only if the current user is the owner */}
                {article.userid === currentUser.uid && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent link navigation
                      deleteArticle(article.id);
                    }}
                    className="block px-4 py-2 text-sm text-red-700 hover:bg-red-100 w-full text-left"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;
