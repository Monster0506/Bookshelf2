// ArticleGraph.js
import React, { useState } from "react";
import SimilarityArticleGraph from "./SimilarityArticleGraph";
import TagsArticleGraph from "./TagsArticleGraph";

const ArticleGraph = () => {
  const [showSimilarityGraph, setShowSimilarityGraph] = useState(false); // Default to Tags graph

  const handleToggle = () => {
    setShowSimilarityGraph(!showSimilarityGraph);
  };

  return (
    <div>
      <button
        onClick={handleToggle}
        className="mb-4 p-2 bg-blue-500 text-white rounded"
      >
        {showSimilarityGraph
          ? "Switch to Tags Graph"
          : "Switch to Similarity Graph"}
      </button>

      {showSimilarityGraph ? (
        <div>
          <h2 className="text-2xl font-semibold mb-4">
            Articles Graph by Similarity
          </h2>
          <SimilarityArticleGraph />
        </div>
      ) : (
        <TagsArticleGraph />
      )}
    </div>
  );
};

export default ArticleGraph;
