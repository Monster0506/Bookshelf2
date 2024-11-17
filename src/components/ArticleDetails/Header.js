import React from "react";
import { FaArrowLeft, FaCog } from "react-icons/fa";
import BackButton from "../BackButton";
import ReadingProgress from "./ReadingProgress";

function Header({ showSidebar, setShowSidebar, articleId }) {
  return (
    <div className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <BackButton />
          
          {/* Show Metadata Button */}
          <button
            type="button"
            onClick={() => setShowSidebar(!showSidebar)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-blue-600 transition-colors duration-200"
          >
            <FaCog className={`transition-transform duration-200 ${showSidebar ? 'rotate-90' : ''}`} />
            {showSidebar ? "Hide Metadata" : "Show Metadata"}
          </button>
        </div>
        
        {/* Reading Progress */}
        <div className="mt-4">
          <ReadingProgress articleId={articleId} />
        </div>
      </div>
    </div>
  );
}

export default Header;
