import React, { useState } from "react";
import { FaPlus } from "react-icons/fa";

function TagManager({
  tags,
  editing,
  canEdit,
  onChange,
  tagSuggestions,
  autoTagSuggestions,
}) {
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAutoTagDropdown, setShowAutoTagDropdown] = useState(false);

  const handleTagSelect = (tag) => {
    const currentTags = tags.split(",").map((tag) => tag.trim());
    if (!currentTags.includes(tag)) {
      const updatedTags = [...currentTags, tag].filter((t) => t).join(", ");
      onChange(updatedTags);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-gray-700">Tags:</label>
      {editing ? (
        <div className="relative">
          <input
            type="text"
            value={tags}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Add tags, separated by commas"
            disabled={!canEdit}
          />
          {/* Existing and Auto Tag Buttons */}
          <div className="relative mt-2">
            <button
              type="button"
              className="flex items-center px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
              onClick={() => setShowTagDropdown(!showTagDropdown)}
            >
              <FaPlus className="mr-1" /> Add from Existing Tags
            </button>
            {showTagDropdown && (
              <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                {tagSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-200"
                    onClick={() => {
                      handleTagSelect(suggestion);
                      setShowTagDropdown(false);
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.split(",").map((tag, index) => (
            <span
              key={index}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full"
            >
              {tag.trim()}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default TagManager;
