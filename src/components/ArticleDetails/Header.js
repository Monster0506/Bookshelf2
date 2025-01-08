import React from "react";
import { FaArrowLeft, FaInfoCircle } from "react-icons/fa";
import BackButton from "../BackButton";
import ReadingProgress from "./ReadingProgress";

function Header({ showSidebar, setShowSidebar, articleId, title, date }) {
  return (
    <div className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <BackButton className="shrink-0" />

          <h1 className="text-lg font-medium text-gray-900 truncate mx-4 text-center flex-1">
            {title}
            <span className="text-sm font-sm text-gray-400 text-center flex-1 pl-3">
              Added on: {date}
            </span>
          </h1>

          {/* Article Details Button */}
          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200 shrink-0"
          >
            <FaInfoCircle
              className={`transition-transform duration-200 ${showSidebar ? "text-blue-600" : ""}`}
            />
            {showSidebar ? "Hide" : "Details"}
          </button>
        </div>

        {/* Reading Progress */}
        <div className="h-1">
          <ReadingProgress articleId={articleId} />
        </div>
      </div>
    </div>
  );
}

export default Header;
