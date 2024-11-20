import React, { useState } from "react";
import SimilarityArticleGraph from "../components/ArticleGraph/SimilarityArticleGraph";
import TagsArticleGraph from "../components/ArticleGraph/TagsArticleGraph";
import TimelineArticleGraph from "../components/ArticleGraph/TimelineArticleGraph";

const ArticleGraph = () => {
  const [currentView, setCurrentView] = useState("tags");

  const views = {
    tags: {
      name: "Tags Graph",
      component: TagsArticleGraph,
      description: "View articles connected by shared tags"
    },
    similarity: {
      name: "Similarity Graph",
      component: SimilarityArticleGraph,
      description: "View articles connected by content similarity"
    },
    timeline: {
      name: "Timeline View",
      component: TimelineArticleGraph,
      description: "View articles arranged chronologically"
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* View Selector */}
        <div className="flex flex-col items-center mb-6 space-y-4">
          <div className="flex flex-wrap justify-center gap-4">
            {Object.entries(views).map(([key, view]) => (
              <button
                key={key}
                onClick={() => setCurrentView(key)}
                className={`px-6 py-2 text-lg font-semibold rounded-lg shadow-md transition duration-300 ${
                  currentView === key
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 hover:bg-blue-50"
                }`}
              >
                {view.name}
              </button>
            ))}
          </div>
          <p className="text-gray-600 text-center">
            {views[currentView].description}
          </p>
        </div>

        {/* Graph Container */}
        <div className={`bg-black p-4 rounded-lg shadow-md ${currentView === 'timeline' ? 'min-h-[600px]' : ''}`}>
          <div>
            <h2 className="text-3xl font-semibold mb-4 text-center text-white">
              {views[currentView].name}
            </h2>
            <div>
              {React.createElement(views[currentView].component)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleGraph;
