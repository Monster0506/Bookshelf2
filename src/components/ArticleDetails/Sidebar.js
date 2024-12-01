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
        if (value === "") {
          setSelectedFolder("");
          setFolderName("");
          setFolderId("");
        } else {
          // Find the folder in the flattened folder structure
          const findFolder = (folders) => {
            for (const folder of folders) {
              if (folder.id === value) {
                return folder;
              }
              if (folder.children?.length > 0) {
                const found = findFolder(folder.children);
                if (found) return found;
              }
            }
            return null;
          };

          const selectedFolderData = findFolder(folders);
          if (selectedFolderData) {
            setSelectedFolder(value);
            setFolderName(selectedFolderData.name);
            setFolderId(value);
          }
        }
        break;
      default:
        break;
    }
  };

  const handleSaveChanges = () => {
    const selectedFolderData = folders.find((folder) => folder.id === selectedFolder);
    
    if (selectedFolder && selectedFolderData) {
      setFolderId(selectedFolder);
      setFolderName(selectedFolderData.name);
    } else {
      setFolderId("");
      setFolderName("");
      setSelectedFolder("");
    }

    const cleanedTags = tags
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0)
      .join(", ");
    setTags(cleanedTags);
    
    setIsPublic(Boolean(isPublic));
    setStatus(status || "");
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
            editing && isSelected ? "bg-blue-100 border-l-4 border-blue-500" : ""
          }`}
          style={{ 
            paddingLeft: `${level * 1.5 + 0.5}rem`,
            transition: 'all 0.2s ease-in-out'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (editing) {
              handleMetadataChange("folderId", folder.id);
            }
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFolder(folder.id);
              }}
              className="mr-2 text-gray-500 hover:text-gray-700 transition-transform duration-200"
              style={{
                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'
              }}
            >
              ▶
            </button>
          )}
          <span 
            className={`truncate ${isSelected ? "font-medium" : ""}`} 
            style={{ color: folder.color }}
          >
            {folder.name}
            {isSelected && !editing && " ✓"}
          </span>
        </div>
        {hasChildren && isExpanded && (
          <div className="border-l border-gray-200 ml-3">
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
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
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

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">
                    {isPublic ? "Public" : "Private"}
                  </span>
                  {editing && (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={isPublic}
                        onChange={(e) => setIsPublic(e.target.checked)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Status</span>
                  {editing ? (
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="px-2 py-1 bg-white border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="UNREAD">Unread</option>
                      <option value="READING">Reading</option>
                      <option value="READ">Read</option>
                    </select>
                  ) : (
                    <span className="text-sm text-gray-600">
                      {status === "UNREAD" ? "Unread" : 
                       status === "READING" ? "Reading" : "Read"}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Archive</span>
                  {editing ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={archived}
                        onChange={(e) => setArchived(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  ) : (
                    <span className={`text-sm ${archived ? "text-amber-600" : "text-gray-600"}`}>
                      {archived ? "Archived" : "Not Archived"}
                    </span>
                  )}
                </div>
              </div>

              <SourceAttribution url={article.source} />

              {(editing || (tags && tags.trim())) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-700">Tags</h3>
                    {editing && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setShowTagSuggestions(!showTagSuggestions)}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Suggestions
                        </button>
                        <button
                          onClick={() => setShowAutoTagSuggestions(!showAutoTagSuggestions)}
                          className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                        >
                          Auto
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    {editing ? (
                      <>
                        <input
                          type="text"
                          value={tags}
                          onChange={(e) => handleMetadataChange("tags", e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Add tags, separated by commas"
                        />
                        <div className="flex flex-wrap gap-1.5">
                          {tags.split(",").filter(tag => tag.trim()).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700"
                            >
                              {tag.trim()}
                              <button
                                onClick={() => handleRemoveTag(tag.trim())}
                                className="ml-1 text-blue-600 hover:text-blue-800"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {tags.split(",").filter(tag => tag.trim()).map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {editing && (showTagSuggestions || showAutoTagSuggestions) && (
                      <div className="mt-2 p-2 bg-white border rounded-md shadow-sm max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-1.5">
                          {showTagSuggestions && tagSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                appendTag(suggestion);
                                setShowTagSuggestions(false);
                              }}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              {suggestion}
                            </button>
                          ))}
                          {showAutoTagSuggestions && autoTagSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => {
                                appendTag(suggestion);
                                setShowAutoTagSuggestions(false);
                              }}
                              className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-medium text-gray-700">
                  {editing ? "Select Folder" : "Current Folder"}
                </h3>
                {!editing && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      {folderId ? (
                        <Link 
                          to={`/folders/${folderId}`}
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 group"
                        >
                          <span>{folderName}</span>
                          <svg 
                            className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path 
                              strokeLinecap="round" 
                              strokeLinejoin="round" 
                              strokeWidth={2} 
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
                            />
                          </svg>
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-700">No Folder</span>
                      )}
                    </div>
                  </div>
                )}
                {editing && (
                  <div className="bg-white border border-gray-200 rounded-md overflow-hidden max-h-60 overflow-y-auto">
                    <div
                      className={`flex items-center p-2 cursor-pointer hover:bg-gray-100 ${
                        !selectedFolder ? "bg-blue-100 border-l-4 border-blue-500" : ""
                      }`}
                      onClick={() => editing && handleMetadataChange("folderId", "")}
                    >
                      <span className="truncate">No Folder</span>
                    </div>
                    {folders.map((folder) => renderFolderOption(folder))}
                  </div>
                )}
                {editing && (
                  <div className="flex items-center space-x-2 mt-2">
                    <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      placeholder="New folder name"
                      className="flex-1 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleAddFolder();
                        }
                      }}
                    />
                    <button
                      onClick={handleAddFolder}
                      className="p-1.5 text-white bg-blue-500 rounded-md hover:bg-blue-600 transition-colors"
                      disabled={!newFolderName.trim()}
                    >
                      <FaPlus size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {saving && (
            <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-md shadow-lg text-sm">
              Saving...
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Sidebar;
