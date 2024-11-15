import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchUserFolders,
  addFolder,
  updateFolder,
} from "../../utils/firestoreUtils";

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
  folderId,
  setFolderId,
  folderName,
  setFolderName,
  autoTagSuggestions,
  showSidebar,
  setShowSidebar,
  saving,
}) {
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showAutoTagSuggestions, setShowAutoTagSuggestions] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(folderId || "");
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const userFolders = await fetchUserFolders(article.userid);
        setFolders(userFolders);
      } catch (error) {
        console.error("Failed to fetch folders", error);
      }
    };

    if (article.userid) {
      fetchFolders();
    }
  }, [article.userid]);

  useEffect(() => {
    setSelectedFolder(folderId || "");
  }, [folderId]);

  const handleMetadataChange = (field, value) => {
    if (field === "tags") {
      const formattedTags = value.replace(/^,?\s*/, "");
      setTags(formattedTags);
    }
    if (field === "status") setStatus(value);
    if (field === "public") setIsPublic(value);
    if (field === "folderId") {
      setSelectedFolder(value);
      const selectedFolderData = folders.find((folder) => folder.id === value);
      setFolderName(selectedFolderData?.name || "");
      setFolderId(value);
    }
  };

  const appendTag = (tag) => {
    const currentTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    if (!currentTags.includes(tag)) {
      setTags([...currentTags, tag].join(", "));
    }
  };

  const handleAddFolder = async () => {
    if (newFolderName.trim() !== "") {
      try {
        const newFolder = await addFolder(newFolderName, article.userid, false);
        const userFolders = await fetchUserFolders(article.userid);
        setFolders(userFolders);
        setNewFolderName("");
        if (newFolder?.id) {
          handleMetadataChange("folderId", newFolder.id);
        }
      } catch (error) {
        console.error("Failed to add folder", error);
      }
    }
  };

  const handleSaveChanges = () => {
    setEditing(false);
    setFolderId(selectedFolder);
    const selectedFolderData = folders.find((folder) => folder.id === selectedFolder);
    setFolderName(selectedFolderData?.name || "");
    saveMetadata();
  };

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  const renderFolderOption = (folder, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children?.length > 0;
    const isSelected = selectedFolder === folder.id;

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 ${
            isSelected ? "bg-blue-50" : ""
          }`}
          style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
          onClick={() => handleMetadataChange("folderId", folder.id)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          <span className="truncate" style={{ color: folder.color }}>
            {folder.name}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map(child => renderFolderOption(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: showSidebar ? 0 : "100%" }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="sticky top-20 float-right mr-4 h-[calc(100vh-7rem)] w-72 bg-white shadow-xl overflow-y-auto z-30 rounded-2xl border border-gray-200"
          style={{ maxHeight: 'calc(100vh - 7rem)' }}
        >
          <div className="p-5">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Metadata</h2>
              {canEdit && (
                <button
                  onClick={() => setEditing(!editing)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium ${
                    editing
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-blue-500 text-white hover:bg-blue-600"
                  } transition-colors`}
                >
                  {editing ? "Save" : "Edit"}
                </button>
              )}
            </div>

            <div className="mb-6">
              <label className="block text-gray-800 mb-3 font-semibold text-lg">
                Tags
              </label>
              {editing ? (
                <>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => handleMetadataChange("tags", e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                    placeholder="Add tags, separated by commas"
                  />

                  <div className="flex gap-4 mt-4">
                    <button
                      onClick={() => setShowTagSuggestions(!showTagSuggestions)}
                      className="px-5 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
                    >
                      Tag Suggestions
                    </button>
                    <button
                      onClick={() =>
                        setShowAutoTagSuggestions(!showAutoTagSuggestions)
                      }
                      className="px-5 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600"
                    >
                      Auto Tag Suggestions
                    </button>
                  </div>

                  {(showTagSuggestions || showAutoTagSuggestions) && (
                    <div className="mt-6 p-4 bg-white border rounded-lg shadow-xl max-h-60 overflow-y-auto">
                      {showTagSuggestions && (
                        <div className="mb-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Tag Suggestions
                          </h3>
                          {tagSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="p-2 cursor-pointer hover:bg-gray-100 rounded transition-all"
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

                      {showAutoTagSuggestions && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            Auto Tag Suggestions
                          </h3>
                          {autoTagSuggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="p-2 cursor-pointer hover:bg-gray-100 rounded transition-all"
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
                  )}
                </>
              ) : (
                tags.trim() && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {tags.split(",").map((tag, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full shadow-lg"
                      >
                        {tag.trim()}
                      </span>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Folder</h3>
              <div className="mb-4">
                <div className="max-h-48 overflow-y-auto border rounded-lg bg-white">
                  <div 
                    className="p-2.5 hover:bg-gray-50 cursor-pointer border-b"
                    onClick={() => handleMetadataChange("folderId", "")}
                  >
                    <span className="text-gray-500">No Folder</span>
                  </div>
                  {folders.map(folder => renderFolderOption(folder))}
                </div>
              </div>
              {editing && (
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="New folder name"
                    className="flex-grow p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    onClick={handleAddFolder}
                    className="p-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <FaPlus />
                  </button>
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Status</h3>
              {editing ? (
                <select
                  value={status}
                  onChange={(e) => handleMetadataChange("status", e.target.value)}
                  className="w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="unread">Unread</option>
                  <option value="reading">Reading</option>
                  <option value="completed">Completed</option>
                </select>
              ) : (
                <div className="text-gray-700 capitalize">{status}</div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Visibility</h3>
              {editing ? (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => handleMetadataChange("public", e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-gray-700">Make article public</label>
                </div>
              ) : (
                <div className="text-gray-700">
                  {isPublic ? "Public" : "Private"}
                </div>
              )}
            </div>

            {saving && (
              <div className="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                Saving...
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;
