import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext"; // Assuming you have a context to get the current user
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
} from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function TrashView() {
  const { currentUser } = useAuth(); // Assume this gives us the logged-in user's ID
  const [trashedArticles, setTrashedArticles] = useState([]);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false); // State to control dropdown visibility

  useEffect(() => {
    const fetchTrashedArticles = async () => {
      setLoading(true);
      setError("");
      try {
        const trashCollection = collection(db, "trash");
        const trashSnapshot = await getDocs(trashCollection);
        // Filter articles to show only those that belong to the current user
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

  // Determine the state of the select/deselect all button
  const getSelectAllState = () => {
    if (selectedArticles.length === 0) return "deselected";
    if (selectedArticles.length === trashedArticles.length) return "selected";
    return "partial";
  };

  // Handle select/deselect all logic
  const toggleSelectAll = () => {
    const currentState = getSelectAllState();
    if (currentState === "selected" || currentState === "partial") {
      setSelectedArticles([]); // Deselect all
    } else {
      setSelectedArticles(trashedArticles.map((article) => article.id)); // Select all
    }
  };

  // Handle selecting or deselecting articles
  const toggleSelectArticle = (articleId) => {
    setSelectedArticles((prevSelected) =>
      prevSelected.includes(articleId)
        ? prevSelected.filter((id) => id !== articleId)
        : [...prevSelected, articleId],
    );
  };

  // Restore an article from trash
  const restoreArticle = async (articleId, articleData) => {
    try {
      const articleRef = doc(db, "articles", articleId);
      await setDoc(articleRef, articleData); // Move article to "articles" collection
      await deleteDoc(doc(db, "trash", articleId)); // Remove article from "trash" collection

      // Update the local state
      setTrashedArticles((prevArticles) =>
        prevArticles.filter((article) => article.id !== articleId),
      );
      setSelectedArticles((prevSelected) =>
        prevSelected.filter((id) => id !== articleId),
      );
      toast.success("Article restored successfully!");
    } catch (error) {
      console.error("Error restoring article:", error);
    }
  };

  // Permanently delete an article
  const permanentlyDeleteArticle = async (articleId) => {
    try {
      await deleteDoc(doc(db, "trash", articleId)); // Permanently delete from "trash" collection

      // Update the local state
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

  // Handle bulk restore
  const bulkRestore = () => {
    selectedArticles.forEach((articleId) => {
      const articleData = trashedArticles.find(
        (article) => article.id === articleId,
      );
      restoreArticle(articleId, articleData);
    });
  };

  // Handle bulk delete
  const bulkDelete = () => {
    selectedArticles.forEach((articleId) => {
      permanentlyDeleteArticle(articleId);
    });
  };

  // Toggle dropdown menu visibility
  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  // Handle dropdown actions
  const selectAll = () => {
    setSelectedArticles(trashedArticles.map((article) => article.id));
    setDropdownOpen(false);
  };

  const selectNone = () => {
    setSelectedArticles([]);
    setDropdownOpen(false);
  };

  if (loading) {
    return <p>Loading trashed articles...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  // Get the icon for the select/deselect all button
  const selectAllIcon =
    getSelectAllState() === "selected" ? (
      <FaCheckSquare />
    ) : getSelectAllState() === "partial" ? (
      <FaMinusSquare />
    ) : (
      <FaSquare />
    );

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Trashed Articles</h1>

      {/* Header Bar for Bulk Actions and Select/Deselect All */}
      <div className="flex items-center justify-between mb-4 p-2 bg-gray-100 rounded-lg shadow-md">
        {/* Dropdown Button */}
        <div className="relative">
          <button
            onClick={toggleDropdown}
            className="text-lg flex items-center p-2 bg-white rounded border hover:bg-gray-50"
          >
            {selectAllIcon}
            <FaCaretDown className="ml-2" />
          </button>
          {dropdownOpen && (
            <div className="absolute mt-2 w-32 bg-white border rounded shadow-lg z-50">
              {" "}
              {/* Added z-50 here */}
              <button
                onClick={selectAll}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Select All
              </button>
              <button
                onClick={selectNone}
                className="block w-full px-4 py-2 text-left hover:bg-gray-100"
              >
                Select None
              </button>
            </div>
          )}
        </div>

        {selectedArticles.length > 0 && (
          <div className="flex gap-4">
            <button
              onClick={bulkRestore}
              className="px-4 py-2 bg-blue-500 text-white rounded flex items-center hover:bg-blue-600"
            >
              <FaUndo className="mr-2" /> Restore Selected
            </button>
            <button
              onClick={bulkDelete}
              className="px-4 py-2 bg-red-500 text-white rounded flex items-center hover:bg-red-600"
            >
              <FaTrashAlt className="mr-2" /> Delete Selected
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trashedArticles.map((article) => (
          <div
            key={article.id}
            className="p-6 bg-white border rounded-lg shadow-md relative"
          >
            {/* Title and Checkbox Container */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold">{article.title}</h2>
              {/* Checkbox for selection */}
              <input
                type="checkbox"
                checked={selectedArticles.includes(article.id)}
                onChange={() => toggleSelectArticle(article.id)}
                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <p className="text-sm text-gray-500 mb-4">{article.source}</p>

            {/* Restore and Delete Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => restoreArticle(article.id, article)}
                className={`px-4 py-2 rounded flex items-center bg-blue-500 text-white hover:bg-blue-600`}
              >
                <FaUndo className="mr-2" /> Restore
              </button>
              <button
                onClick={() => permanentlyDeleteArticle(article.id)}
                className={`px-4 py-2 rounded flex items-center bg-red-500 text-white hover:bg-red-600`}
              >
                <FaTrashAlt className="mr-2" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrashView;
