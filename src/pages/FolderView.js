import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchArticlesInFolder,
  fetchFolder,
  updateFolderWithArticle,
  deleteFolder,
  updateFolder,
  addFolder,
} from "../utils/firestoreUtils";
import { motion, AnimatePresence } from "framer-motion";
import { FaLock, FaLockOpen, FaTrash, FaEye, FaEyeSlash, FaTimes, FaBook, FaFolder, FaFolderOpen, FaPlus, FaShare, FaCopy, FaCheck } from "react-icons/fa";
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
  const [subfolders, setSubfolders] = useState([]);
  const [parentFolder, setParentFolder] = useState(null);
  const [showAddSubfolder, setShowAddSubfolder] = useState(false);
  const [newSubfolderName, setNewSubfolderName] = useState("");
  const [isAddingSubfolder, setIsAddingSubfolder] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareUrlRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching folder data for ID:", folderId);
        const articlesData = await fetchArticlesInFolder(folderId);
        const folderData = await fetchFolder(folderId);
        console.log("Folder data received:", folderData);
        
        if (!folderData.public && !currentUser) {
          setError("This folder is private. Please log in to view it.");
          setLoading(false);
          return;
        }
        
        setFolder(folderData);
        setArticles(articlesData);

        // Fetch parent folder if it exists
        if (folderData.parentId) {
          console.log("Fetching parent folder:", folderData.parentId);
          const parentData = await fetchFolder(folderData.parentId);
          console.log("Parent folder data:", parentData);
          setParentFolder(parentData);
        } else {
          setParentFolder(null);
        }
        
        // Set subfolders if they exist
        console.log("Checking for subfolders in:", folderData);
        if (folderData.subfolders && folderData.subfolders.length > 0) {
          console.log("Found subfolders:", folderData.subfolders);
          const subfoldersData = await Promise.all(
            folderData.subfolders.map(async childId => {
              console.log("Fetching subfolder:", childId);
              const subfolder = await fetchFolder(childId);
              console.log("Subfolder data:", subfolder);
              return subfolder;
            })
          );
          const validSubfolders = subfoldersData.filter(Boolean);
          console.log("Valid subfolders:", validSubfolders);
          setSubfolders(validSubfolders);
        } else {
          console.log("No subfolders found in folder data");
          setSubfolders([]);
        }
      } catch (err) {
        console.error("Error loading folder:", err);
        setError("Failed to load folder.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [folderId, currentUser]);

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

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

  const handleAddSubfolder = async (e) => {
    e.preventDefault();
    if (!currentUser || !newSubfolderName.trim()) return;

    setIsAddingSubfolder(true);
    try {
      // Create new subfolder
      const { id: newSubfolderId } = await addFolder(
        newSubfolderName.trim(),
        currentUser.uid,
        folder.public,
        folderId,
        { color: folder.color }
      );

      // Update parent folder's subfolders array
      const updatedSubfolders = [...(folder.subfolders || []), newSubfolderId];
      await updateFolder(folderId, {
        subfolders: updatedSubfolders,
        updatedAt: new Date(),
      });

      // Update local state
      const newSubfolderData = await fetchFolder(newSubfolderId);
      setSubfolders(prev => [...prev, newSubfolderData]);
      setFolder(prev => ({
        ...prev,
        subfolders: updatedSubfolders
      }));
      setNewSubfolderName("");
      setShowAddSubfolder(false);
    } catch (error) {
      console.error("Error adding subfolder:", error);
      setError("Failed to create subfolder.");
    } finally {
      setIsAddingSubfolder(false);
    }
  };

  const handleCopyShareLink = () => {
    const shareUrl = `${window.location.origin}/folders/${folderId}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
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
                      {folder?.public && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowShareModal(true)}
                          className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                        >
                          <FaShare className="mr-2" />
                          Share
                        </motion.button>
                      )}
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
                                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                              >
                                <FaTimes />
                              </motion.button>
                            )}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No articles in this folder yet.
                    </div>
                  )}
                </div>

                {/* Related Folders Section */}
                <div className="border-t border-gray-200 pt-6 mt-8">
                  <h3 className="text-2xl font-semibold text-gray-800 mb-6">
                    Related Folders
                  </h3>

                  {/* Parent Folder Section */}
                  {parentFolder && (
                    <div className="mb-8">
                      <h4 className="text-xl font-semibold text-gray-700 mb-4">
                        Parent Folder
                      </h4>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="relative group"
                      >
                        <Link
                          to={`/folders/${parentFolder.id}`}
                          className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          <div className="flex items-center mb-2">
                            <FaFolderOpen className="text-xl mr-2" style={{ color: parentFolder.color || '#3B82F6' }} />
                            <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                              {parentFolder.name}
                            </h4>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <span className="mr-4">
                              {parentFolder.articles?.length || 0} articles
                            </span>
                            {parentFolder.public ? (
                              <div className="flex items-center">
                                <FaLockOpen className="mr-1" />
                                <span>Public</span>
                              </div>
                            ) : (
                              <div className="flex items-center">
                                <FaLock className="mr-1" />
                                <span>Private</span>
                              </div>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    </div>
                  )}

                  {/* Subfolders Section */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xl font-semibold text-gray-700">
                        Subfolders {subfolders.length > 0 && `(${subfolders.length})`}
                      </h4>
                      {currentUser && !folder?.parentId && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setShowAddSubfolder(true)}
                          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          <FaPlus className="mr-2" />
                          Add Subfolder
                        </motion.button>
                      )}
                    </div>

                    {/* Add Subfolder Form */}
                    <AnimatePresence>
                      {showAddSubfolder && (
                        <motion.form
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          onSubmit={handleAddSubfolder}
                          className="mb-6"
                        >
                          <div className="flex gap-4">
                            <input
                              type="text"
                              value={newSubfolderName}
                              onChange={(e) => setNewSubfolderName(e.target.value)}
                              placeholder="Enter subfolder name"
                              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              disabled={isAddingSubfolder}
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="submit"
                              disabled={isAddingSubfolder || !newSubfolderName.trim()}
                              className={`px-6 py-2 rounded-lg text-white font-medium transition-colors ${
                                isAddingSubfolder || !newSubfolderName.trim()
                                  ? "bg-gray-400"
                                  : "bg-blue-500 hover:bg-blue-600"
                              }`}
                            >
                              {isAddingSubfolder ? "Creating..." : "Create"}
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => setShowAddSubfolder(false)}
                              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                            >
                              Cancel
                            </motion.button>
                          </div>
                        </motion.form>
                      )}
                    </AnimatePresence>

                    {subfolders.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {subfolders.map((subfolder) => (
                          <motion.div
                            key={subfolder.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="relative group"
                          >
                            <Link
                              to={`/folders/${subfolder.id}`}
                              className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                            >
                              <div className="flex items-center mb-2">
                                <FaFolder className="text-xl mr-2" style={{ color: subfolder.color || '#3B82F6' }} />
                                <h4 className="text-xl font-bold text-gray-800 group-hover:text-blue-600 transition-colors">
                                  {subfolder.name}
                                </h4>
                              </div>
                              <div className="flex items-center text-sm text-gray-500">
                                <span className="mr-4">
                                  {subfolder.articles?.length || 0} articles
                                </span>
                                {subfolder.public ? (
                                  <div className="flex items-center">
                                    <FaLockOpen className="mr-1" />
                                    <span>Public</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center">
                                    <FaLock className="mr-1" />
                                    <span>Private</span>
                                  </div>
                                )}
                              </div>
                            </Link>
                          </motion.div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        No subfolders.
                      </div>
                    )}
                  </div>

                  {!parentFolder && subfolders.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No related folders.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Share Modal */}
            <AnimatePresence>
              {showShareModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900">Share Folder</h3>
                      <button
                        onClick={() => setShowShareModal(false)}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    <div className="mb-6">
                      <p className="text-gray-600 mb-4">
                        Share this folder with others by copying the link below:
                      </p>
                      <div className="flex items-center gap-2">
                        <input
                          ref={shareUrlRef}
                          type="text"
                          readOnly
                          value={`${window.location.origin}/folders/${folderId}`}
                          className="flex-1 p-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                        />
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleCopyShareLink}
                          className="flex items-center px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                        >
                          {copied ? (
                            <>
                              <FaCheck className="mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <FaCopy className="mr-2" />
                              Copy
                            </>
                          )}
                        </motion.button>
                      </div>
                    </div>

                    <div className="text-gray-500 text-sm">
                      <p>Note: Only people with the link can view this folder.</p>
                    </div>

                    <div className="mt-6 flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowShareModal(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                      >
                        Close
                      </motion.button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
              {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Delete Folder?
                      </h3>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="text-gray-400 hover:text-gray-500 transition-colors"
                      >
                        <FaTimes />
                      </button>
                    </div>

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
                </div>
              )}
            </AnimatePresence>
          </>
        )}
      </motion.div>
    </div>
  );
}

export default FolderView;
