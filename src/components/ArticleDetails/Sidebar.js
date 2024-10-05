import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function Sidebar({
  article,
  tags,
  setTags,
  status,
  setStatus,
  isPublic,
  setIsPublic,
  saveMetadata,
  editing,
  setEditing,
  canEdit,
  tagSuggestions,
  autoTagSuggestions,
  showSidebar,
  setShowSidebar,
  saving,
}) {
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showAutoTagSuggestions, setShowAutoTagSuggestions] = useState(false);

  const handleMetadataChange = (field, value) => {
    if (field === "tags") {
      const formattedTags = value.replace(/^,?\s*/, "");
      setTags(formattedTags);
    }
    if (field === "status") setStatus(value);
    if (field === "public") setIsPublic(value);
  };

  // Function to append a tag to the tags input
  const appendTag = (tag) => {
    const currentTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!currentTags.includes(tag)) {
      setTags([...currentTags, tag].join(", "));
    }
  };

  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed top-0 right-0 h-fit w-80 bg-white shadow-lg p-6 lg:relative lg:static rounded-lg border"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-800">Metadata</h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditing(!editing);
                  if (editing) saveMetadata();
                }}
                className={`inline px-4 py-2 border ${
                  editing ? "bg-green-500" : "bg-blue-500"
                } text-white rounded-lg hover:opacity-80 transition duration-300`}
              >
                {editing ? "Save Changes" : "Edit Metadata"}
              </button>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Tags:
            </label>
            {editing ? (
              <>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => handleMetadataChange("tags", e.target.value)}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tags, separated by commas"
                />

                {/* Tag Suggestions Button */}
                <div className="mt-2">
                  <button
                    onClick={() => setShowTagSuggestions(!showTagSuggestions)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Tag Suggestions
                  </button>
                  {showTagSuggestions && (
                    <div className="mt-2 p-2 bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                      {tagSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-1 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            appendTag(suggestion);
                            setShowTagSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Auto Tag Suggestions Button */}
                <div className="mt-2">
                  <button
                    onClick={() =>
                      setShowAutoTagSuggestions(!showAutoTagSuggestions)
                    }
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Auto Tag Suggestions
                  </button>
                  {showAutoTagSuggestions && (
                    <div className="mt-2 p-2 bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                      {autoTagSuggestions.map((suggestion, index) => (
                        <div
                          key={index}
                          className="p-1 cursor-pointer hover:bg-gray-100"
                          onClick={() => {
                            appendTag(suggestion);
                            setShowAutoTagSuggestions(false);
                          }}
                        >
                          {suggestion}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.split(",").map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                  >
                    {tag.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Public Status:
            </label>
            {editing ? (
              <select
                value={isPublic ? "Public" : "Private"}
                onChange={(e) =>
                  handleMetadataChange("public", e.target.value === "Public")
                }
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            ) : (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  isPublic
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isPublic ? "Public" : "Private"}
              </span>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Status:
            </label>
            {editing ? (
              <select
                value={status}
                onChange={(e) => handleMetadataChange("status", e.target.value)}
                className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="READ">Read</option>
                <option value="UNREAD">Unread</option>
              </select>
            ) : (
              <span
                className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
                  status === "READ"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {status}
              </span>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 mb-2 font-medium">
              Source:
            </label>
            <Link to={article.source} target="_blank" rel="noopener noreferrer">
              <p
                className="text-blue-600 hover:text-blue-800 hover:underline font-medium truncate"
                title={article.source}
              >
                {article.source}
              </p>
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;
