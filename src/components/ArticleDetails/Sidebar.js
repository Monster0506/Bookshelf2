import React, { useState, useEffect } from "react";
import { FaPlus } from "react-icons/fa";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  fetchUserFolders,
  addFolder,
  updateFolder,
} from "../../utils/firestoreUtils";
import SourceAttribution from "./Content/SourceAttribution";

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
  archived,
  setArchived,
}) {
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [showAutoTagSuggestions, setShowAutoTagSuggestions] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(folderId || "");
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [newTag, setNewTag] = useState("");

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
    console.log('Metadata change:', field, value);
    switch (field) {
      case "tags":
        const formattedTags = value.replace(/^,?\s*/, "").trim();
        setTags(formattedTags);
        break;
      case "status":
        setStatus(value);
        break;
      case "public":
        setIsPublic(value);
        break;
      case "folderId":
        setSelectedFolder(value);
        if (value === "") {
          // Clear folder
          setFolderName("");
          setFolderId("");
        } else {
          const selectedFolderData = folders.find((folder) => folder.id === value);
          if (selectedFolderData) {
            setFolderName(selectedFolderData.name);
            setFolderId(value);
          }
        }
        break;
      default:
        console.warn("Unknown metadata field:", field);
    }
  };

  const handleSaveChanges = () => {
    // Ensure all state is properly set before saving
    const selectedFolderData = folders.find((folder) => folder.id === selectedFolder);
    
    // Update folder information
    if (selectedFolder && selectedFolderData) {
      setFolderId(selectedFolder);
      setFolderName(selectedFolderData.name);
    } else {
      // Clear folder if none selected
      setFolderId("");
      setFolderName("");
    }

    // Clean up tags
    const cleanedTags = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .join(", ");
    setTags(cleanedTags);

    // Ensure boolean for public status
    setIsPublic(Boolean(isPublic));
    
    // Ensure status is string
    setStatus(status || "");

    // Exit edit mode and save
    setEditing(false);
    saveMetadata();
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

  const handleRemoveTag = (tag) => {
    const currentTags = tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const newTags = currentTags.filter((t) => t !== tag);
    setTags(newTags.join(", "));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === "Enter") {
      appendTag(newTag);
      setNewTag("");
    }
  };

  const handleArchiveChange = (e) => {
    console.log('Archive checkbox clicked:', e.target.checked);
    setArchived(e.target.checked);
  };

  return (
    <AnimatePresence>
      {showSidebar && (
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: showSidebar ? 0 : "100%" }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="sticky top-16 float-right w-80 bg-white shadow-lg overflow-y-auto z-30 rounded-lg border border-gray-200"
          style={{ maxHeight: 'calc(100vh - 4rem)' }}
        >
          <div className="p-4">
            {/* Header with Edit Button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Details</h2>
              {canEdit && (
                <button
                  onClick={editing ? handleSaveChanges : () => setEditing(true)}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    editing
                      ? "bg-green-500 hover:bg-green-600 text-white"
                      : "bg-blue-500 hover:bg-blue-600 text-white"
                  }`}
                  disabled={saving}
                >
                  {saving ? "Saving..." : editing ? "Save" : "Edit"}
                </button>
              )}
            </div>

            {/* Visibility Toggle */}
            {editing ? (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-700">Visibility</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isPublic ? "Anyone can view this article" : "Only you can view this article"}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <div className="flex items-center text-sm">
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-md ${
                    isPublic ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  }`}>
                    {isPublic ? "Public" : "Private"}
                  </span>
                </div>
              </div>
            )}

            {/* Source Attribution */}
            <SourceAttribution url={article.source} />

            {/* Status Section */}
            <div className="mb-4 space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">Reading Status</h3>
                <select
                  value={status}
                  onChange={(e) => {
                    console.log('Status dropdown changed:', e.target.value);
                    setStatus(e.target.value);
                  }}
                  disabled={!editing}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="UNREAD">Unread</option>
                  <option value="READING">Reading</option>
                  <option value="READ">Read</option>
                </select>
              </div>
              
              <div className="flex items-center pl-1">
                <input
                  type="checkbox"
                  id="archive-checkbox"
                  checked={archived}
                  onChange={handleArchiveChange}
                  disabled={!editing}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                />
                <label 
                  htmlFor="archive-checkbox" 
                  className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
                >
                  Archive this article
                </label>
              </div>
              {/* Debug info */}
              {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mt-1">
                  Status: {status}, Archived: {archived.toString()}
                </div>
              )}
            </div>

            {/* Tags Section */}
            {(editing || (tags && tags.trim())) && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Tags</h3>
                <div className="space-y-2">
                  {editing ? (
                    <>
                      <div className="flex flex-wrap gap-2">
                        {tags.split(",").filter(tag => tag.trim()).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-blue-100 text-blue-700"
                          >
                            {tag.trim()}
                            <button
                              onClick={() => handleRemoveTag(tag.trim())}
                              className="ml-1.5 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => handleMetadataChange("tags", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Add tags, separated by commas"
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => setShowTagSuggestions(!showTagSuggestions)}
                          className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                        >
                          Tag Suggestions
                        </button>
                        <button
                          onClick={() => setShowAutoTagSuggestions(!showAutoTagSuggestions)}
                          className="px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                        >
                          Auto Tags
                        </button>
                      </div>

                      {/* Tag Suggestions Panel */}
                      {(showTagSuggestions || showAutoTagSuggestions) && (
                        <div className="mt-2 p-3 bg-white border rounded-md shadow-sm max-h-48 overflow-y-auto">
                          {showTagSuggestions && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Suggested Tags</h4>
                              <div className="flex flex-wrap gap-2">
                                {tagSuggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      appendTag(suggestion);
                                      setShowTagSuggestions(false);
                                    }}
                                    className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {showAutoTagSuggestions && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-2">Auto-Generated Tags</h4>
                              <div className="flex flex-wrap gap-2">
                                {autoTagSuggestions.map((suggestion, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      appendTag(suggestion);
                                      setShowAutoTagSuggestions(false);
                                    }}
                                    className="px-2 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.split(",").filter(tag => tag.trim()).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 rounded-md text-sm bg-blue-100 text-blue-700"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Folder Section */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Folder</h3>
              <div className="max-h-48 overflow-y-auto border rounded-lg bg-white">
                <div 
                  className="p-2.5 hover:bg-gray-50 cursor-pointer border-b"
                  onClick={() => handleMetadataChange("folderId", "")}
                >
                  <span className="text-gray-500">No Folder</span>
                </div>
                {folders.map(folder => renderFolderOption(folder))}
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

            {saving && (
              <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-md shadow-lg text-sm">
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
