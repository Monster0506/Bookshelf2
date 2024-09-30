import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  getDoc,
  setDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { FaSearch, FaFilter, FaEllipsisV } from "react-icons/fa";

function ArticleList() {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // State for sorting, filtering, and searching
  const [sortOption, setSortOption] = useState("date");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [publicFilter, setPublicFilter] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState(false);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // State to track the context menu visibility
  const [contextMenu, setContextMenu] = useState(null);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError("");
      try {
        const articlesCollection = collection(db, "articles");

        // Query for both the logged-in user's articles and public articles
        const userArticlesQuery = query(
          articlesCollection,
          where("userid", "==", currentUser.uid),
        );
        const publicArticlesQuery = query(
          articlesCollection,
          where("public", "==", true),
        );

        const [userArticlesSnapshot, publicArticlesSnapshot] =
          await Promise.all([
            getDocs(userArticlesQuery),
            getDocs(publicArticlesQuery),
          ]);

        // Combine user and public articles, avoiding duplicates
        const articlesData = [
          ...userArticlesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })),
          ...publicArticlesSnapshot.docs
            .filter((doc) => doc.data().userid !== currentUser.uid) // Avoid duplicates
            .map((doc) => ({ id: doc.id, ...doc.data() })),
        ];

        setArticles(articlesData);
        setFilteredArticles(articlesData);
      } catch (err) {
        console.error("Error fetching articles:", err);
        setError("Failed to load articles. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchArticles();
    }
  }, [currentUser]);

  // Filtering logic
  useEffect(() => {
    let filtered = [...articles];

    // Search by title, content, or URL
    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.markdown.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.source.toLowerCase().includes(searchQuery.toLowerCase()),
      );
    }

    // Filter by status
    if (statusFilter) {
      filtered = filtered.filter((article) => article.status === statusFilter);
    }

    // Filter by file type
    if (fileTypeFilter) {
      filtered = filtered.filter(
        (article) => article.filetype === fileTypeFilter,
      );
    }

    // Filter by public/private
    if (publicFilter) {
      filtered = filtered.filter((article) => article.public === publicFilter);
    }

    // Filter by archive status
    if (archiveFilter) {
      filtered = filtered.filter((article) => article.archived);
    } else {
      filtered = filtered.filter((article) => !article.archived);
    }

    // Filter by tags (article must include the tag)
    if (tagFilter) {
      filtered = filtered.filter(
        (article) =>
          article.tags &&
          article.tags.some(
            (tag) => tag.toLowerCase() === tagFilter.toLowerCase(),
          ),
      );
    }

    // Sorting logic
    filtered.sort((a, b) => {
      switch (sortOption) {
        case "title":
          return a.title.localeCompare(b.title);
        case "date":
          return b.date.seconds - a.date.seconds; // Assuming date is a Firestore timestamp
        case "readingTime":
          return parseInt(a.read.words) - parseInt(b.read.words);
        default:
          return 0;
      }
    });

    setFilteredArticles(filtered);
  }, [
    articles,
    searchQuery,
    statusFilter,
    fileTypeFilter,
    tagFilter,
    publicFilter,
    archiveFilter,
    sortOption,
  ]);

  // Function to toggle the article's status
  const toggleArticleStatus = async (articleId, currentStatus) => {
    const newStatus = currentStatus === "UNREAD" ? "READ" : "UNREAD";
    try {
      const articleRef = doc(db, "articles", articleId);
      await updateDoc(articleRef, { status: newStatus });

      // Update the local state
      setArticles((prevArticles) =>
        prevArticles.map((article) =>
          article.id === articleId
            ? { ...article, status: newStatus }
            : article,
        ),
      );
    } catch (error) {
      console.error("Error updating article status:", error);
    }
  };

  // Function to archive the article
  const archiveArticle = async (articleId, currentArchived) => {
    try {
      const articleRef = doc(db, "articles", articleId);
      await updateDoc(articleRef, { archived: !currentArchived });

      // Update the local state
      setArticles((prevArticles) =>
        prevArticles.map((article) =>
          article.id === articleId
            ? { ...article, archived: !currentArchived }
            : article,
        ),
      );
    } catch (error) {
      console.error("Error archiving article:", error);
    }
  };

  // Function to delete the article
  const deleteArticle = async (articleId) => {
    try {
      const articleRef = doc(db, "articles", articleId);
      const articleSnapshot = await getDoc(articleRef);

      if (articleSnapshot.exists()) {
        const articleData = articleSnapshot.data();

        // Copy the article data to the "trash" collection
        const trashRef = doc(db, "trash", articleId); // Use the same ID for the trash document
        await setDoc(trashRef, {
          ...articleData,
          trashedAt: new Date(), // Add a timestamp to indicate when it was moved to trash
        });

        // Delete the article from the "articles" collection
        await deleteDoc(articleRef);

        // Update the local state
        setArticles((prevArticles) =>
          prevArticles.filter((article) => article.id !== articleId),
        );
      } else {
        console.error("Article not found.");
      }
    } catch (error) {
      console.error("Error moving article to trash:", error);
    }
  };
  // Function to handle context menu visibility
  const handleContextMenuToggle = (articleId) => {
    setContextMenu((prevState) => (prevState === articleId ? null : articleId));
  };

  if (loading) {
    return <p>Loading articles...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>

      {/* Search Bar and Filter Button */}
      <div className="flex items-center mb-4">
        <div className="relative flex-grow">
          <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
          <input
            type="text"
            placeholder="Search by title, content, or URL"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2 pl-10 border rounded"
          />
        </div>
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className="p-2 ml-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <FaFilter />
        </button>
      </div>

      {/* Filter Menu */}
      {showFilterMenu && (
        <div className="p-4 mb-4 bg-white border rounded shadow-md space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 border rounded bg-gray-100"
            >
              <option value="">All Statuses</option>
              <option value="READ">Read</option>
              <option value="UNREAD">Unread</option>
            </select>

            <select
              value={fileTypeFilter}
              onChange={(e) => setFileTypeFilter(e.target.value)}
              className="p-2 border rounded bg-gray-100"
            >
              <option value="">All File Types</option>
              <option value="URL">URL</option>
              <option value="PDF">PDF</option>
              <option value="HTML">HTML</option>
            </select>

            <input
              type="text"
              placeholder="Filter by tag"
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="p-2 border rounded bg-gray-100"
            />

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={publicFilter}
                onChange={(e) => setPublicFilter(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Public Only</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={archiveFilter}
                onChange={(e) => setArchiveFilter(e.target.checked)}
                className="h-4 w-4"
              />
              <span>Show Archived</span>
            </label>

            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
              className="p-2 border rounded bg-gray-100"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
              <option value="readingTime">Sort by Reading Time</option>
            </select>
          </div>
        </div>
      )}

      {/* Article List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className="p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 relative"
          >
            <h2 className="text-2xl font-semibold mb-2 text-gray-800">
              {article.title}
            </h2>
            <p className="text-sm text-gray-500 mb-4">{article.source}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              {article.tags &&
                article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
            </div>

            <div className="text-gray-600 mb-2">
              <p className="mb-1">
                Reading Time:{" "}
                <span className="font-medium">
                  {article.read.minutes || "N/A"}
                </span>
              </p>
            </div>

            {/* Context Menu */}
            <div className="absolute top-2 right-2">
              <div className="relative inline-block text-left">
                <button
                  className="inline-flex justify-center w-full p-2 text-sm font-medium text-gray-500 hover:text-gray-700"
                  aria-haspopup="true"
                  aria-expanded="true"
                  onClick={() => handleContextMenuToggle(article.id)}
                >
                  <FaEllipsisV />
                </button>
                {contextMenu === article.id && (
                  <div className="origin-top-right absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                    <div
                      className="py-1"
                      role="menu"
                      aria-orientation="vertical"
                      aria-labelledby="options-menu"
                    >
                      <button
                        onClick={() => {
                          toggleArticleStatus(article.id, article.status);
                          setContextMenu(null);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        {article.status === "UNREAD"
                          ? "Mark as Read"
                          : "Mark as Unread"}
                      </button>
                      <button
                        onClick={() => {
                          archiveArticle(article.id, article.archived);
                          setContextMenu(null);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        {article.archived ? "Unarchive" : "Archive"}
                      </button>
                      <button
                        onClick={() => {
                          deleteArticle(article.id);
                          setContextMenu(null);
                        }}
                        className="block px-4 py-2 text-sm text-red-700 hover:bg-red-100 w-full text-left"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ArticleList;
