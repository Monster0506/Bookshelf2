import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaFolder,
  FaFolderOpen,
  FaLock,
  FaLockOpen,
  FaPlus,
  FaChevronDown,
  FaChevronUp,
  FaBook,
} from "react-icons/fa";
import {
  fetchUserFolders,
  addFolder,
  updateFolder,
  deleteFolder,
  fetchArticlesInFolder,
} from "../utils/firestoreUtils";

function FolderList() {
  const { currentUser } = useAuth();
  const [folders, setFolders] = useState([]);
  const [newFolderName, setNewFolderName] = useState("");
  const [expandedFolders, setExpandedFolders] = useState({});

  useEffect(() => {
    loadFolders();
  }, [currentUser]);

  const loadFolders = async () => {
    if (!currentUser) return;
    try {
      const userFolders = await fetchUserFolders(currentUser.uid);
      setFolders(userFolders);
    } catch (error) {
      console.error("Error loading folders:", error);
    }
  };

  const handleAddFolder = async () => {
    if (!newFolderName.trim() || !currentUser) return;
    try {
      await addFolder(newFolderName.trim(), currentUser.uid, false);
      setNewFolderName("");
      loadFolders();
    } catch (error) {
      console.error("Error adding folder:", error);
    }
  };

  const handleUpdateFolder = async (folderId, isPublic) => {
    try {
      await updateFolder(folderId, { public: isPublic });
      setFolders(
        folders.map((folder) =>
          folder.id === folderId ? { ...folder, public: isPublic } : folder
        )
      );
    } catch (error) {
      console.error("Error updating folder:", error);
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await deleteFolder(folderId);
      setFolders(folders.filter((folder) => folder.id !== folderId));
      setExpandedFolders((prev) => {
        const newState = { ...prev };
        delete newState[folderId];
        return newState;
      });
    } catch (error) {
      console.error("Error deleting folder:", error);
    }
  };

  const toggleArticles = async (folderId) => {
    if (expandedFolders[folderId]) {
      setExpandedFolders((prev) => ({
        ...prev,
        [folderId]: false,
      }));
      return;
    }

    try {
      const articles = await fetchArticlesInFolder(folderId);
      setFolders(
        folders.map((folder) =>
          folder.id === folderId ? { ...folder, articles } : folder
        )
      );
      setExpandedFolders((prev) => ({
        ...prev,
        [folderId]: true,
      }));
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white shadow rounded-lg p-6">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Manage Folders</h2>
        <div className="flex gap-4 mb-6">
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-grow p-3 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a new folder name"
          />
          <button
            onClick={handleAddFolder}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded shadow hover:bg-blue-700 transition-colors"
          >
            <FaPlus className="inline mr-2" />
            Add Folder
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {folders.map((folder) => (

            <motion.div
              key={folder.id}
              className="bg-gray-50 p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
              layout
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold text-gray-700 flex items-center">
                  {folder.public ? (
                    <FaFolderOpen className="mr-2 text-blue-500" />
                  ) : (
                    <FaFolder className="mr-2 text-blue-500" />
                  )}
                  <Link
                    to={`/folders/${folder.id}`}
                    className="block group"
                  >
                    {folder.name}</Link>
                </h3>
                <button
                  onClick={() => handleUpdateFolder(folder.id, !folder.public)}
                  className={`px-4 py-2 rounded text-sm font-semibold shadow transition-colors flex items-center ${folder.public
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-500 text-white hover:bg-gray-600"
                    }`}
                >
                  {folder.public ? (
                    <>
                      <FaLockOpen className="mr-2" /> Public
                    </>
                  ) : (
                    <>
                      <FaLock className="mr-2" /> Private
                    </>
                  )}
                </button>
              </div>

              <div className="flex justify-between items-center mt-4">
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="px-4 py-2 bg-red-500 text-white rounded shadow hover:bg-red-600 text-sm transition-colors"
                >
                  Delete
                </button>
                <button
                  onClick={() => toggleArticles(folder.id)}
                  className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600 text-sm transition-colors flex items-center"
                >
                  {expandedFolders[folder.id] ? (
                    <>
                      Hide Articles <FaChevronUp className="ml-2" />
                    </>
                  ) : (
                    <>
                      View Articles <FaChevronDown className="ml-2" />
                    </>
                  )}
                </button>
              </div>

              <AnimatePresence>
                {expandedFolders[folder.id] && folder.articles && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-4 border-t pt-4">
                      {folder.articles.length > 0 ? (
                        <ul className="space-y-2">
                          {folder.articles.map((article) => (
                            <motion.li
                              key={article.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              exit={{ opacity: 0, x: -20 }}
                              className="flex items-center"
                            >
                              <FaBook className="text-gray-400 mr-2" />
                              <Link
                                to={`/articles/${article.id}`}
                                className="text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {article.title}
                              </Link>
                            </motion.li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-center">No articles in this folder</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default FolderList;
