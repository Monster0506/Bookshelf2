import React, { useState } from "react";
import SimilarityArticleGraph from "../components/ArticleGraph/SimilarityArticleGraph";
import TagsArticleGraph from "../components/ArticleGraph/TagsArticleGraph";

const ArticleGraph = () => {
  const [showSimilarityGraph, setShowSimilarityGraph] = useState(false);

  const handleToggle = () => {
    setShowSimilarityGraph(!showSimilarityGraph);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Toggle Button */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleToggle}
            className="px-6 py-2 text-lg font-semibold text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition duration-300"
          >
            {showSimilarityGraph
              ? "Switch to Tags Graph"
              : "Switch to Similarity Graph"}
          </button>
        </div>

        {/* Graph Container */}
        <div className="bg-white p-4 rounded-lg shadow-md">
          {showSimilarityGraph ? (
            <div>
              <h2 className="text-3xl font-semibold mb-4 text-center text-gray-800">
                Articles Graph by Similarity
              </h2>
              <SimilarityArticleGraph />
            </div>
          ) : (
            <div>
              <h2 className="text-3xl font-semibold mb-4 text-center text-gray-800">
                Articles Graph by Tags
              </h2>
              <TagsArticleGraph />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArticleGraph;
