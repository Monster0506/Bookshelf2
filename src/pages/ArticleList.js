import React, { useState, useEffect, useMemo } from "react";
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
  orderBy,
} from "firebase/firestore";
import { FaFilter, FaTh, FaList } from "react-icons/fa";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";
import ArticleCard from "../components/ArticleList/ArticleCard";
import SearchBar from "../components/ArticleList/SearchBar";
import FilterMenu from "../components/ArticleList/FilterMenu";
import ShareModal from "../components/ArticleList/ShareModal";
import { motion } from "framer-motion";
import ArticleListCard from "../components/ArticleList/ArticleListCard";

function ArticleList() {
  const { currentUser } = useAuth();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // New feature: Toggle view mode between grid and list

  // State for sorting, filtering, and searching
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [publicFilter, setPublicFilter] = useState(false);
  const [archiveFilter, setArchiveFilter] = useState(false);
  const [folderFilter, setFolderFilter] = useState("");
  const [sortOption, setSortOption] = useState("date");
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });
  const [readingTimeRange, setReadingTimeRange] = useState({ min: "", max: "" });
  const [wordCountRange, setWordCountRange] = useState({ min: "", max: "" });

  // State to track the context menu visibility
  const [contextMenu, setContextMenu] = useState(null);

  // State for share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState("");

  // Function to open share modal
  const handleShare = (articleId) => {
    const fullUrl = `${window.location.origin}/articles/${articleId}`;
    setShareLink(fullUrl);
    setShowShareModal(true);
  };

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      setError("");
      try {
        const articlesCollection = collection(db, "articles");

        // Create compound queries for better performance
        const userArticlesQuery = query(
          articlesCollection,
          where("userid", "==", currentUser.uid),
          // Add orderBy to optimize the query
          orderBy("date", "desc")
        );

        const publicArticlesQuery = query(
          articlesCollection,
          where("public", "==", true),
          where("userid", "!=", currentUser.uid),
          orderBy("userid"),
          orderBy("date", "desc")
        );

        // Use Promise.all for parallel fetching
        const [userArticlesSnapshot, publicArticlesSnapshot] = await Promise.all([
          getDocs(userArticlesQuery),
          getDocs(publicArticlesQuery),
        ]);

        // Process snapshots in parallel using Promise.all
        const [userArticles, publicArticles] = await Promise.all([
          Promise.all(userArticlesSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              // Pre-format date to avoid repeated conversions
              dateFormatted: data.date?.toDate().toLocaleDateString(),
              // Pre-calculate other commonly used values
              wordCount: data.wordCount || 0,
              readingTime: data.readingTime || "0 min",
            };
          })),
          Promise.all(publicArticlesSnapshot.docs.map(async (doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              dateFormatted: data.date?.toDate().toLocaleDateString(),
              wordCount: data.wordCount || 0,
              readingTime: data.readingTime || "0 min",
            };
          })),
        ]);

        // Combine articles and update state
        const articlesData = [...userArticles, ...publicArticles];
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

  // Optimize filtering logic with useMemo
  useMemo(() => {
    // Create a single filtering function for better performance
    const filterArticle = (article) => {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        article.title?.toLowerCase().includes(searchLower) ||
        article.markdown?.toLowerCase().includes(searchLower) ||
        article.source?.toLowerCase().includes(searchLower);

      const matchesStatus = !statusFilter || article.status === statusFilter;
      const matchesFileType = !fileTypeFilter || article.filetype === fileTypeFilter;
      const matchesFolder = !folderFilter || article.folderId === folderFilter;
      const matchesPublic = !publicFilter || article.public === publicFilter;
      const matchesArchive = archiveFilter ? article.archived : !article.archived;
      const matchesTag =
        !tagFilter || (article.tags || []).some((tag) =>
          tag.toLowerCase() === tagFilter.toLowerCase()
        );

      // Date range check
      const articleDate = article.date?.toDate();
      const matchesDateRange =
        (!dateRange.from || (articleDate && articleDate >= new Date(dateRange.from))) &&
        (!dateRange.to || (articleDate && articleDate <= new Date(dateRange.to)));

      // Reading time range check
      const readingTimeMinutes = parseInt(article.readingTime);
      const matchesReadingTime =
        (!readingTimeRange.min || readingTimeMinutes >= parseInt(readingTimeRange.min)) &&
        (!readingTimeRange.max || readingTimeMinutes <= parseInt(readingTimeRange.max));

      // Word count range check
      const matchesWordCount =
        (!wordCountRange.min || article.wordCount >= parseInt(wordCountRange.min)) &&
        (!wordCountRange.max || article.wordCount <= parseInt(wordCountRange.max));

      return (
        matchesSearch &&
        matchesStatus &&
        matchesFileType &&
        matchesFolder &&
        matchesPublic &&
        matchesArchive &&
        matchesTag &&
        matchesDateRange &&
        matchesReadingTime &&
        matchesWordCount
      );
    };

    const filtered = articles.filter(filterArticle);
    setFilteredArticles(filtered);
  }, [
    articles,
    searchQuery,
    statusFilter,
    fileTypeFilter,
    folderFilter,
    publicFilter,
    archiveFilter,
    tagFilter,
    dateRange,
    readingTimeRange,
    wordCountRange,
  ]);

  const toggleViewMode = () => {
    setViewMode((prevMode) => (prevMode === "grid" ? "list" : "grid"));
  };

  const handleContextMenuToggle = (articleId) => {
    setContextMenu((prevState) => (prevState === articleId ? null : articleId));
  };

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
            : article
        )
      );
    } catch (error) {
      console.error("Error updating article status:", error);
    }
  };

  const archiveArticle = async (articleId, currentArchived) => {
    try {
      const articleRef = doc(db, "articles", articleId);
      const articleSnapshot = await getDoc(articleRef);

      if (articleSnapshot.exists()) {
        const articleData = articleSnapshot.data();

        // Check if the current user is the owner of the article
        if (articleData.userid !== currentUser.uid) {
          console.error("You do not have permission to archive this article.");
          return;
        }

        // Update the archive status
        await updateDoc(articleRef, { archived: !currentArchived });

        // Update the local state
        setArticles((prevArticles) =>
          prevArticles.map((article) =>
            article.id === articleId
              ? { ...article, archived: !currentArchived }
              : article
          )
        );
      } else {
        console.error("Article not found.");
      }
    } catch (error) {
      console.error("Error archiving article:", error);
    }
  };

  const deleteArticle = async (articleId) => {
    try {
      const articleRef = doc(db, "articles", articleId);
      const articleSnapshot = await getDoc(articleRef);

      if (articleSnapshot.exists()) {
        const articleData = articleSnapshot.data();

        // Check if the current user is the owner of the article
        if (articleData.userid !== currentUser.uid) {
          console.error("You do not have permission to delete this article.");
          return;
        }

        // Copy the article data to the "trash" collection
        const trashRef = doc(db, "trash", articleId);
        await setDoc(trashRef, {
          ...articleData,
          trashedAt: new Date(),
        });

        // Delete the article from the "articles" collection
        await deleteDoc(articleRef);

        // Update the local state
        setArticles((prevArticles) =>
          prevArticles.filter((article) => article.id !== articleId)
        );
      } else {
        console.error("Article not found.");
      }
    } catch (error) {
      console.error("Error moving article to trash:", error);
    }
  };

  const handleTagClick = (tag) => {
    setTagFilter(tag);
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-4xl font-bold mb-6 text-gray-800">Articles</h1>
      <div className="flex items-center mb-6">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className="p-2 ml-2 bg-white border border-gray-300 rounded hover:bg-gray-200"
        >
          <FaFilter />
        </button>
        <button
          onClick={toggleViewMode}
          className="p-2 ml-4 bg-white border border-gray-300 rounded hover:bg-gray-200"
        >
          {viewMode === "grid" ? <FaList /> : <FaTh />}
        </button>
      </div>
      {/* Filter Menu */}
      {showFilterMenu && (
        <FilterMenu
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          fileTypeFilter={fileTypeFilter}
          setFileTypeFilter={setFileTypeFilter}
          tagFilter={tagFilter}
          setTagFilter={setTagFilter}
          publicFilter={publicFilter}
          setPublicFilter={setPublicFilter}
          archiveFilter={archiveFilter}
          setArchiveFilter={setArchiveFilter}
          sortOption={sortOption}
          setSortOption={setSortOption}
          dateRange={dateRange}
          setDateRange={setDateRange}
          readingTimeRange={readingTimeRange}
          setReadingTimeRange={setReadingTimeRange}
          wordCountRange={wordCountRange}
          setWordCountRange={setWordCountRange}
          folderFilter={folderFilter}
          setFolderFilter={setFolderFilter}
        />
      )}
      {/* Results Found Section */}
      {filteredArticles.length !== 0 &&
        filteredArticles.length !== articles.length && (
          <div className="mb-4 text-gray-700">
            Found {filteredArticles.length} of {articles.length} articles
          </div>
        )}
      {/* Article List */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <ArticleCard
                article={article}
                handleContextMenuToggle={handleContextMenuToggle}
                contextMenu={contextMenu}
                toggleArticleStatus={toggleArticleStatus}
                archiveArticle={archiveArticle}
                deleteArticle={deleteArticle}
                currentUser={currentUser}
                handleShare={handleShare}
                handleTagClick={handleTagClick}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article, index) => (
            <motion.div
              key={article.id}
              className="bg-white rounded-lg  relative"
              initial={{ opacity: 0, y: 60 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <ArticleListCard
                article={article}
                archiveArticle={archiveArticle}
                handleTagClick={handleTagClick}
                deleteArticle={deleteArticle}
                handleShare={handleShare}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Share Modal */}
      <ShareModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareLink={shareLink}
        generateShareUrl={(platform) => {
          const encodedLink = encodeURIComponent(shareLink);
          switch (platform) {
            case "facebook":
              return `https://www.facebook.com/sharer/sharer.php?u=${encodedLink}`;
            case "twitter":
              return `https://twitter.com/intent/tweet?url=${encodedLink}`;
            case "email":
              return `mailto:?subject=Check%20this%20out&body=${encodedLink}`;
            default:
              return "";
          }
        }}
      />
    </div>
  );
}

export default ArticleList;
