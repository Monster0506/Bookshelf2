import React from "react";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import { format } from "date-fns";
import { motion } from "framer-motion";

function ContentSection({
  article,
  title,
  setTitle,
  saveNotes,
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
    <motion.div
      className="p-6 bg-white shadow rounded-lg"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.h1
        className="text-3xl font-bold mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {editing ? (
          <motion.input
            type="text"
            value={title}
            onChange={(e) => handleMetadataChange("title", e.target.value)}
            className="w-full p-2 border rounded"
            disabled={!canEdit}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          />
        ) : (
          title
        )}
      </motion.h1>

      {createdAt && (
        <motion.p
          className="text-sm text-gray-500 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          Created: {format(new Date(createdAt.seconds * 1000), "PPp")}
        </motion.p>
      )}

      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <h2 className="text-2xl font-semibold mb-2">Summary</h2>
        {!showSummary ? (
          <motion.button
            onClick={() => setShowSummary(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            Show Summary
          </motion.button>
        ) : (
          <motion.p
            className="text-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {article.summary || "No summary available."}
          </motion.p>
        )}
      </motion.div>

      <motion.div
        className="prose mb-6 markdown-content"
        dangerouslySetInnerHTML={{
          __html: article.markdown || "No content available.",
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      ></motion.div>

      <motion.div
        className="mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <h2 className="text-2xl font-semibold mb-2">Notes</h2>
        <MdEditor
          value={notes}
          style={{ height: "300px" }}
          renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
          onChange={({ text }) => {
            setNotes(text);
            saveNotes();
          }}
          readOnly={!canEdit}
        />
        <div className="text-sm text-gray-500 mt-2">
          {saving ? "Saving..." : "Saved"}
        </div>
      </motion.div>

      <motion.div
        className="mt-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <h2 className="text-2xl font-semibold mb-4">Related Articles</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {relatedArticles.map((relatedArticle) => (
            <motion.div
              key={relatedArticle.id}
              className="p-4 bg-white shadow rounded-lg hover:shadow-md transition duration-300"
              whileHover={{ scale: 1.02 }}
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
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ContentSection;
