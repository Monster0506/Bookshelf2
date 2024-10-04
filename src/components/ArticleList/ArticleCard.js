import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaEllipsisV } from "react-icons/fa";
import { CSSTransition } from "react-transition-group";
import ShareModal from "./ShareModal";
import "../../css/ArticleCard.css"; // Custom CSS for additional animations

function ArticleCard({
  article,
  handleContextMenuToggle,
  contextMenu,
  toggleArticleStatus,
  archiveArticle,
  deleteArticle,
  currentUser,
}) {
  const [shareLink, setShareLink] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);

  // Set the base URL once when the component mounts
  useEffect(() => {
    const fullUrl = `${window.location.origin}/articles/${article.id}`;
    setShareLink(fullUrl);
  }, [article.id]);

  const handleShare = () => {
    setShowShareModal(true);
  };

  const generateShareUrl = (platform) => {
    const encodedLink = encodeURIComponent(shareLink);
    switch (platform) {
      case "facebook":
        return `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`;
      case "twitter":
        return `https://twitter.com/intent/tweet?url=${encodedLink}`;
      case "email":
        return `mailto:?subject=Check%20this%20out&body=${encodedLink}`;
      default:
        return "";
    }
  };

  return (
    <div key={article.id} className="relative">
      {/* Share Modal with Animation */}
      <CSSTransition
        in={showShareModal}
        timeout={300}
        classNames="modal"
        unmountOnExit
      >
        <ShareModal
          show={showShareModal}
          onClose={() => setShowShareModal(false)}
          shareLink={shareLink}
          generateShareUrl={generateShareUrl}
        />
      </CSSTransition>

      <Link
        to={`/articles/${article.id}`}
        className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-2xl transition-shadow duration-500 transform hover:scale-105"
      >
        <h2 className="text-2xl font-semibold mb-2 text-gray-800 transition-transform duration-500 hover:translate-x-1">
          {article.title}
        </h2>
        <p className="text-sm text-gray-500 mb-4">{article.source}</p>

        <div className="flex flex-wrap gap-2 mb-4">
          {article.tags &&
            article.tags.map((tag, index) => (
              <span
                key={index}
                className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full transition-transform duration-500 transform hover:scale-110"
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

      {/* Context Menu with Animation */}
      <div className="absolute top-2 right-2">
        <div className="relative inline-block text-left">
          <button
            className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-transform duration-300 transform hover:rotate-90"
            aria-haspopup="true"
            aria-expanded="true"
            onClick={(e) => {
              e.stopPropagation(); // Prevent link navigation
              handleContextMenuToggle(article.id);
            }}
          >
            <FaEllipsisV />
          </button>
          <CSSTransition
            in={contextMenu === article.id}
            timeout={200}
            classNames="context-menu"
            unmountOnExit
          >
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
                <button
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                  type="button"
                  onClick={handleShare}
                >
                  Share
                </button>
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
          </CSSTransition>
        </div>
      </div>
    </div>
  );
}

export default ArticleCard;
