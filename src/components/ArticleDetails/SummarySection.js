import React from "react";

function SummarySection({ summary, showSummary, onToggleSummary }) {
  return (
    <div className="mb-4">
      <h2 className="text-2xl font-semibold mb-2">Summary</h2>
      {!showSummary ? (
        <button
          type="button"
          onClick={onToggleSummary}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Show Summary
        </button>
      ) : (
        <p className="text-gray-700">{summary || "No summary available."}</p>
      )}
    </div>
  );
}

export default SummarySection;
