import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import {
  FaUndo,
  FaTrashAlt,
  FaCheckSquare,
  FaMinusSquare,
  FaSquare,
  FaCaretDown,
  FaTh,
  FaList,
} from "react-icons/fa";
import { motion } from "framer-motion";
import Modal from "react-modal";

function TrashView() {
  const { currentUser } = useAuth();
  const [trashedArticles, setTrashedArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("date");
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalContent, setModalContent] = useState({});
  const [viewMode, setViewMode] = useState("grid"); // New feature: Toggle view mode between grid and list

  useEffect(() => {
    const fetchTrashedArticles = async () => {
      setLoading(true);
      setError("");
      try {
        const trashCollection = collection(db, "trash");
        const trashSnapshot = await getDocs(trashCollection);
        const articles = trashSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((article) => article.userid === currentUser.uid);
        setTrashedArticles(articles);
      } catch (err) {
        console.error("Error fetching trashed articles:", err);
        setError("Failed to load trashed articles.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrashedArticles();
  }, [currentUser]);

  const getSelectAllState = () => {
    if (selectedArticles.length === 0) return "deselected";
    if (selectedArticles.length === trashedArticles.length) return "selected";
    return "partial";
  };

  const toggleSelectAll = () => {
    const currentState = getSelectAllState();
    if (currentState === "selected" || currentState === "partial") {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(trashedArticles.map((article) => article.id));
    }
  };

  const toggleSelectArticle = (articleId) => {
    setSelectedArticles((prevSelected) =>
      prevSelected.includes(articleId)
        ? prevSelected.filter((id) => id !== articleId)
        : [...prevSelected, articleId],
    );
  };

  const restoreArticle = async (articleId, articleData) => {
    try {
      const articleRef = doc(db, "articles", articleId);
      await setDoc(articleRef, articleData);
      await deleteDoc(doc(db, "trash", articleId));

      setTrashedArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== articleId),
      );
      setSelectedArticles((prevSelected) =>
        prevSelected.filter((id) => id !== articleId),
      );
    } catch (error) {
      console.error("Error restoring article:", error);
    }
  };

  const permanentlyDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, "trash", articleId));
      setTrashedArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== articleId),
      );
      setSelectedArticles((prevSelected) =>
        prevSelected.filter((id) => id !== articleId),
      );
    } catch (error) {
      console.error("Error permanently deleting article:", error);
    }
  };

  const openModal = (content) => {
    setModalContent(content);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const bulkRestore = () => {
    const selectedTitles = trashedArticles
      .filter((article) => selectedArticles.includes(article.id))
      .map((article) => article.title)
      .join(", ");

    openModal({
      title: "Restore Selected Articles",
      message: `Are you sure you want to restore ${selectedArticles.length} selected articles?\n\nArticles: ${selectedTitles}`,
      details: `These articles will be restored to your library. Please double-check your selection before proceeding.`,
      onConfirm: () => {
        selectedArticles.forEach((articleId) => {
          const articleData = trashedArticles.find(
            (article) => article.id === articleId,
          );
          restoreArticle(articleId, articleData);
        });
        closeModal();
      },
    });
  };

  const bulkDelete = () => {
    const selectedTitles = trashedArticles
      .filter((article) => selectedArticles.includes(article.id))
      .map((article) => article.title)
      .join(", ");

    openModal({
      title: "Delete Selected Articles",
      message: `Are you sure you want to permanently delete ${selectedArticles.length} selected articles? This action cannot be undone.\n\nArticles: ${selectedTitles}`,
      details: `These articles will be removed from your trash permanently and cannot be restored. Please double-check your selection before proceeding.`,
      onConfirm: () => {
        selectedArticles.forEach((articleId) => {
          permanentlyDeleteArticle(articleId);
        });
        closeModal();
      },
    });
  };

  const permanentlyDeleteAll = () => {
    const allTitles = trashedArticles
      .map((article) => article.title)
      .join(", ");

    openModal({
      title: "Empty Trash",
      message: `Are you sure you want to permanently delete all ${trashedArticles.length} articles? This action cannot be undone.\n\nArticles: ${allTitles}`,
      details: `This will remove all articles from your trash permanently, and they cannot be restored. Please make sure you want to delete all items before confirming.`,
      onConfirm: async () => {
        try {
          const deletePromises = trashedArticles.map((article) =>
            deleteDoc(doc(db, "trash", article.id)),
          );
          await Promise.all(deletePromises);
          setTrashedArticles([]);
          setSelectedArticles([]);
        } catch (err) {
          console.error("Error deleting all trashed articles:", err);
          setError("Failed to delete all articles.");
        } finally {
          closeModal();
        }
      },
    });
  };

  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === "grid" ? "list" : "grid"));
  };

  const selectAllIcon =
    getSelectAllState() === "selected" ? (
      <FaCheckSquare />
    ) : getSelectAllState() === "partial" ? (
      <FaMinusSquare />
    ) : (
      <FaSquare />
    );

  const filteredArticles = trashedArticles
    .filter((article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "source") return a.source.localeCompare(b.source);
      return b.date - a.date;
    });

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-4xl font-extrabold mb-4 text-center text-gray-800">
        Trashed Articles
      </h1>

      <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg shadow">
        <input
          type="text"
          placeholder="Search articles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
        />
        <button
          onClick={permanentlyDeleteAll}
          className="ml-4 px-5 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition-all"
        >
          Empty Trash
        </button>
      </div>

      <div className="flex items-center justify-between mb-6">
        <label className="flex items-center space-x-3 text-gray-700">
          <span className="font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="ml-2 p-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          >
            <option value="date">Date</option>
            <option value="title">Title</option>
            <option value="source">Source</option>
          </select>
        </label>
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSelectAll}
            className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 shadow transition-all"
          >
            {selectAllIcon}
            <FaCaretDown className="ml-2" />
          </button>
          <button
            onClick={toggleViewMode}
            className="flex items-center p-3 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 shadow transition-all"
          >
            {viewMode === "grid" ? <FaList /> : <FaTh />}
          </button>
        </div>
      </div>

      {selectedArticles.length > 0 && (
        <div className="flex gap-4 mb-6">
          <motion.button
            onClick={bulkRestore}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center shadow hover:bg-blue-700 transition-all"
            whileHover={{ scale: 1.05 }}
          >
            <FaUndo className="mr-2" /> Restore Selected
          </motion.button>
          <motion.button
            onClick={bulkDelete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg flex items-center shadow hover:bg-red-700 transition-all"
            whileHover={{ scale: 1.05 }}
          >
            <FaTrashAlt className="mr-2" /> Delete Selected
          </motion.button>
        </div>
      )}

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article) => (
            <motion.div
              key={article.id}
              className="p-6 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 truncate">
                  {article.title}
                </h2>
                <input
                  type="checkbox"
                  checked={selectedArticles.includes(article.id)}
                  onChange={() => toggleSelectArticle(article.id)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
              </div>
              <p className="text-sm text-gray-500 mb-4 italic truncate">
                {article.source}
              </p>
              <p className="text-base text-gray-700 mb-4 leading-relaxed line-clamp-3">
                {article.summary || "No summary available."}
              </p>

              <div className="flex items-center justify-between mt-4">
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      openModal({
                        title: "Restore Article",
                        message: `Are you sure you want to restore this article titled '${article.title}'?`,
                        details: `This article will be restored to your library. Please confirm if you want to proceed.`,
                        onConfirm: () => {
                          restoreArticle(article.id, article);
                          closeModal();
                        },
                      });
                    }}
                    className="px-5 py-2 rounded-lg flex items-center bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FaUndo className="mr-2" /> Restore
                  </motion.button>
                  <motion.button
                    onClick={() => permanentlyDeleteArticle(article.id)}
                    className="px-5 py-2 rounded-lg flex items-center bg-red-600 text-white hover:bg-red-700 shadow-md transition-all"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FaTrashAlt className="mr-2" /> Delete
                  </motion.button>
                </div>
                <span className="text-sm text-gray-400">
                  {article.date.seconds}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <motion.div
              key={article.id}
              className="p-4 bg-white border border-gray-200 rounded-lg shadow-lg hover:shadow-2xl transition-shadow duration-300 relative"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              whileHover={{ scale: 1.03 }}
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-gray-900">
                  {article.title}
                </h2>
                <input
                  type="checkbox"
                  checked={selectedArticles.includes(article.id)}
                  onChange={() => toggleSelectArticle(article.id)}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
              </div>
              <p className="text-sm text-gray-500 mb-2 italic">
                {article.source}
              </p>
              <p className="text-base text-gray-700 mb-4 leading-relaxed">
                {article.summary || "No summary available."}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <motion.button
                    onClick={() => {
                      openModal({
                        title: "Restore Article",
                        message: `Are you sure you want to restore this article titled '${article.title}'?`,
                        details: `This article will be restored to your library. Please confirm if you want to proceed.`,
                        onConfirm: () => {
                          restoreArticle(article.id, article);
                          closeModal();
                        },
                      });
                    }}
                    className="px-5 py-2 rounded-lg flex items-center bg-blue-600 text-white hover:bg-blue-700 shadow-md transition-all"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FaUndo className="mr-2" /> Restore
                  </motion.button>
                  <motion.button
                    onClick={() => permanentlyDeleteArticle(article.id)}
                    className="px-5 py-2 rounded-lg flex items-center bg-red-600 text-white hover:bg-red-700 shadow-md transition-all"
                    whileHover={{ scale: 1.05 }}
                  >
                    <FaTrashAlt className="mr-2" /> Delete
                  </motion.button>
                </div>
                <span className="text-sm text-gray-400">
                  {article.date.seconds}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        className="fixed inset-0 flex items-center justify-center p-4 bg-black bg-opacity-50"
        overlayClassName="fixed inset-0 bg-black bg-opacity-25"
      >
        <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full">
          <h2 className="text-2xl font-bold mb-4">{modalContent.title}</h2>
          <p className="text-gray-700 mb-4">{modalContent.message}</p>
          <p className="text-gray-500 mb-6">{modalContent.details}</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={modalContent.onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}

export default TrashView;
