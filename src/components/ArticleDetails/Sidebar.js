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
  const [selectedFolder, setSelectedFolder] = useState(article.folderId || "");
  const [newFolderName, setNewFolderName] = useState("");

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

  const handleMetadataChange = (field, value) => {
    if (field === "tags") {
      const formattedTags = value.replace(/^,?\s*/, "");
      setTags(formattedTags);
    }
    if (field === "status") setStatus(value);
    if (field === "public") setIsPublic(value);
    if (field === "folderId") setSelectedFolder(value);
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
        await addFolder(newFolderName, article.userid, false);
        const userFolders = await fetchUserFolders(article.userid);
        setFolders(userFolders);
        setNewFolderName("");
      } catch (error) {
        console.error("Failed to add folder", error);
      }
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
          className="fixed top-0 right-0 h-full w-96 bg-white shadow-2xl p-8 lg:relative lg:static rounded-l-lg border"
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Metadata</h2>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  setEditing(!editing);
                  if (editing) {
                    setFolderId(selectedFolder);
                    setFolderName(
                      folders.find((folder) => folder.id === selectedFolder)
                        ?.name || "",
                    );
                    saveMetadata();
                    article.folderId = selectedFolder;
                    article.folderName =
                      folders.find((folder) => folder.id === selectedFolder)
                        ?.name || "";
                  }
                }}
                className={`inline px-5 py-2 font-semibold text-sm border rounded-lg transition-all duration-300 shadow-lg ${
                  editing ? "bg-green-600" : "bg-blue-600"
                } text-white hover:shadow-xl hover:opacity-90`}
              >
                {editing ? "Save Changes" : "Edit Metadata"}
              </button>
            )}
          </div>

          <div className="mb-8">
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
                    className="px-5 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-all"
                  >
                    Tag Suggestions
                  </button>
                  <button
                    onClick={() =>
                      setShowAutoTagSuggestions(!showAutoTagSuggestions)
                    }
                    className="px-5 py-2 bg-green-500 text-white rounded-lg shadow hover:bg-green-600 transition-all"
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

          <div className="mb-8">
            <label className="block text-gray-800 mb-3 font-semibold text-lg">
              Folder
            </label>
            {editing ? (
              <>
                <select
                  value={selectedFolder}
                  onChange={(e) =>
                    handleMetadataChange("folderId", e.target.value)
                  }
                  className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                >
                  <option value="">No Folder</option>
                  {folders?.map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 mt-4">
                  <input
                    type="text"
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                    placeholder="New Folder Name"
                  />
                  <button
                    onClick={handleAddFolder}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600 transition-all"
                  >
                    <FaPlus />
                  </button>
                </div>
              </>
            ) : (
              selectedFolder && (
                <span className="text-gray-800">
                  <Link
                    to={`/folders/${selectedFolder}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                  >
                    {folders.find((folder) => folder.id === selectedFolder)
                      ?.name || "No Folder"}
                  </Link>
                </span>
              )
            )}
          </div>

          <div className="mb-8">
            <label className="block text-gray-800 mb-3 font-semibold text-lg">
              Public Status
            </label>
            {editing ? (
              <select
                value={isPublic ? "Public" : "Private"}
                onChange={(e) =>
                  handleMetadataChange("public", e.target.value === "Public")
                }
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              >
                <option value="Public">Public</option>
                <option value="Private">Private</option>
              </select>
            ) : (
              <span
                className={`inline-block px-4 py-2 text-sm font-medium rounded-full shadow ${
                  isPublic
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {isPublic ? "Public" : "Private"}
              </span>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-gray-800 mb-3 font-semibold text-lg">
              Status
            </label>
            {editing ? (
              <select
                value={status}
                onChange={(e) => handleMetadataChange("status", e.target.value)}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
              >
                <option value="READ">Read</option>
                <option value="UNREAD">Unread</option>
              </select>
            ) : (
              <span
                className={`inline-block px-4 py-2 text-sm font-medium rounded-full shadow ${
                  status === "READ"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {status}
              </span>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-gray-800 mb-3 font-semibold text-lg">
              Source
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
