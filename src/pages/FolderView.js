import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchArticlesInFolder,
  fetchFolder,
  updateFolderWithArticle,
  deleteFolder,
  updateFolder,
} from "../utils/firestoreUtils";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaLockOpen, FaTrash, FaEye, FaEyeSlash, FaTimes, FaBook } from "react-icons/fa";
import "../css/FolderView.css";

function FolderView() {
  const folderId = useParams().id;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const articlesData = await fetchArticlesInFolder(folderId);
        const folderData = await fetchFolder(folderId);
        if (!folderData.public && !currentUser) {
          setError("This folder is private. Please log in to view it.");
          setLoading(false);
          return;
        }
        setFolder(folderData);
        setArticles(articlesData);
      } catch (err) {
        setError("Failed to load folder.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [folderId, currentUser]);

  const handleDeleteFolder = async () => {
    if (!currentUser) return;
    setIsDeleting(true);
    try {
      await deleteFolder(folderId);
      navigate("/folders");
    } catch (err) {
      setError("Failed to delete folder: " + err.message);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRemoveArticle = async (articleId) => {
    if (!currentUser) return;
    try {
      await updateFolderWithArticle(folderId, articleId, true);
      setArticles(articles.filter((article) => article.id !== articleId));
    } catch (err) {
      setError("Failed to remove article from folder.");
    }
  };

  const handleUpdateFolderPrivacy = async () => {
    if (!currentUser || !folder) return;
    try {
      await updateFolder(folderId, { public: !folder.public });
      setFolder((prevFolder) => ({
        ...prevFolder,
        public: !prevFolder.public,
      }));
    } catch (err) {
      setError("Failed to update folder privacy.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        className="max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        {error ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </motion.div>
        ) : (
          <>
            <div className="bg-white shadow-xl rounded-lg overflow-hidden mb-8">
              <div className="p-6 sm:p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-gray-900 flex items-center">
                    <FaBook className="mr-3 text-blue-500" />
                    {folder?.name}
                  </h2>
                  {currentUser && (
                    <div className="flex items-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleUpdateFolderPrivacy}
                        className={`flex items-center px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                          folder?.public
                            ? "bg-yellow-500 hover:bg-yellow-600"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {folder?.public ? (
                          <>
                            <FaEyeSlash className="mr-2" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <FaEye className="mr-2" />
                            Make Public
                          </>
                        )}
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
                      >
                        <FaTrash className="mr-2" />
                        Delete
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="flex items-center mb-8">
                  {folder?.public ? (
                    <div className="flex items-center text-green-500">
                      <FaLockOpen className="mr-2" />
                      <span className="font-medium">Public Folder</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-500">
                      <FaLock className="mr-2" />
                      <span className="font-medium">Private Folder</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                    Articles ({articles.length})
                  </h3>
                  {articles.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {articles.map((article) => (
                        <motion.div
                          key={article.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="relative group"
                        >
                          <Link
                            to={`/articles/${article.id}`}
                            className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                          >
                            <h4 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
                              {article.title}
                            </h4>
                            <p className="text-gray-600 mb-4 line-clamp-2">
                              {article.description || "No description available"}
                            </p>
                            {currentUser && (
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleRemoveArticle(article.id);
                                }}
                                className="absolute top-4 right-4 p-2 bg-red-100 text-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <FaTimes />
                              </motion.button>
                            )}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12 bg-gray-50 rounded-lg"
                    >
                      <p className="text-gray-600 text-lg">
                        No articles in this folder yet.
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Delete Folder?
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this folder? This action cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleDeleteFolder();
                  }}
                  disabled={isDeleting}
                  className={`px-4 py-2 bg-red-500 text-white rounded-lg font-medium flex items-center ${
                    isDeleting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-red-600'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      Deleting...
                    </>
                  ) : (
                    'Delete'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FolderView;
