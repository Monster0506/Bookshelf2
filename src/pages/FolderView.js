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
import { motion } from "framer-motion";
import "../css/FolderView.css";

function FolderView() {
  const folderId = useParams().id;
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [folder, setFolder] = useState(null);
  const [articles, setArticles] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

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
    try {
      await deleteFolder(folderId);
      navigate("/folders");
    } catch (err) {
      setError("Failed to delete folder.");
    }
  };

  const handleRemoveArticle = async (articleId) => {
    if (!currentUser) return;
    try {
      await updateFolderWithArticle(folderId, articleId, true); // Assume true means removing the article
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
    return <div>Loading...</div>;
  }

  return (
    <motion.div
      className="p-8 bg-white shadow-lg rounded-lg max-w-4xl mx-auto mt-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      {error ? (
        <p className="text-red-500 text-center mb-6">{error}</p>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
            {folder?.name}
          </h2>

          {currentUser && (
            <div className="flex justify-center mb-8 space-x-4">
              <button
                onClick={handleUpdateFolderPrivacy}
                className={`px-6 py-3 rounded-md text-white transition-all duration-300 ${
                  folder?.public
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-gray-500 hover:bg-gray-600"
                }`}
              >
                {folder?.public ? "Make Private" : "Make Public"}
              </button>
              <button
                onClick={handleDeleteFolder}
                className="px-6 py-3 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-300"
              >
                Delete Folder
              </button>
            </div>
          )}

          <h3 className="text-2xl font-semibold text-gray-700 mb-4">
            Articles in Folder
          </h3>
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <Link
                  to={`/articles/${article.id}`}
                  key={article.id}
                  className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <h4 className="text-lg font-bold text-gray-800 mb-2">
                    {article.title}
                  </h4>
                  <p className="text-gray-600">Click to read more</p>
                  {currentUser && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveArticle(article.id);
                      }}
                      className="mt-4 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-all duration-300"
                    >
                      Remove Article
                    </button>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No articles in this folder.</p>
          )}
        </>
      )}
    </motion.div>
  );
}

export default FolderView;
