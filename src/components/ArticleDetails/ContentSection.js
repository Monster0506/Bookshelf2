import React from "react";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import { format } from "date-fns";

function ContentSection({
  article,
  title,
  setTitle,
  notes,
  setNotes,
  editing,
  setEditing,
  status,
  setStatus,
  tags,
  setTags,
  createdAt,
  showSummary,
  setShowSummary,
  relatedArticles,
  canEdit,
  isPublic,
  setIsPublic,
  tagSuggestions,
  setTagSuggestions,
  saving,
}) {
  const handleMetadataChange = (field, value) => {
    if (field === "title") setTitle(value);
    if (field === "public") setIsPublic(value);
    if (field === "tags") {
      const formattedTags = value.replace(/^,?\s*/, "");
      setTags(formattedTags);
    }
    if (field === "status") setStatus(value);
  };

  return (
    <div className="p-6 bg-white shadow rounded-lg">
      <h1 className="text-3xl font-bold mb-4">
        {editing ? (
          <input
            type="text"
            value={title}
            onChange={(e) => handleMetadataChange("title", e.target.value)}
            className="w-full p-2 border rounded"
            disabled={!canEdit}
          />
        ) : (
          title
        )}
      </h1>
      {createdAt && (
        <p className="text-sm text-gray-500 mb-4">
          Created: {format(new Date(createdAt.seconds * 1000), "PPp")}
        </p>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Summary</h2>
        {!showSummary ? (
          <button
            onClick={() => setShowSummary(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300"
          >
            Show Summary
          </button>
        ) : (
          <p className="text-gray-700">
            {article.summary || "No summary available."}
          </p>
        )}
      </div>

      <div
        className="prose mb-6"
        dangerouslySetInnerHTML={{
          __html: article.markdown || "No content available.",
        }}
      ></div>

      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">Notes</h2>
        <MdEditor
          value={notes}
          style={{ height: "300px" }}
          renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
          onChange={({ text }) => setNotes(text)}
          readOnly={!canEdit}
        />
        <div className="text-sm text-gray-500 mt-2">
          {saving ? "Saving..." : "Saved"}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-2xl font-semibold mb-4">Related Articles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatedArticles.map((relatedArticle) => (
            <div
              key={relatedArticle.id}
              className="p-4 bg-white shadow rounded-lg hover:shadow-md transition duration-300"
            >
              <a
                href={`/articles/${relatedArticle.id}`}
                className="text-blue-600 hover:underline text-lg font-medium block mb-2"
              >
                {relatedArticle.title}
              </a>
              <p className="text-sm text-gray-500">
                Similarity Score: {(relatedArticle.similarity * 100).toFixed(0)}
                %
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ContentSection;
