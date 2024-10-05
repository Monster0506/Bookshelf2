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
import { FaFilter } from "react-icons/fa";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";
import ArticleCard from "../components/ArticleList/ArticleCard";
import SearchBar from "../components/ArticleList/SearchBar";
import FilterMenu from "../components/ArticleList/FilterMenu";

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
    //
    if (tagFilter) {
      filtered = filtered.filter((article) =>
        (article.tags || []).some(
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
      const articleSnapshot = await getDoc(articleRef);

      if (articleSnapshot.exists()) {
        const articleData = articleSnapshot.data();

        // Check if the current user is the owner of the article
        if (articleData.userid !== currentUser.uid) {
          console.error("You do not have permission to archive this article.");
          return; // Exit the function if the user is not the owner
        }

        // Update the archive status
        await updateDoc(articleRef, { archived: !currentArchived });

        // Update the local state
        setArticles((prevArticles) =>
          prevArticles.map((article) =>
            article.id === articleId
              ? { ...article, archived: !currentArchived }
              : article,
          ),
        );
      } else {
        console.error("Article not found.");
      }
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

        // Check if the current user is the owner of the article
        if (articleData.userid !== currentUser.uid) {
          console.error("You do not have permission to delete this article.");
          return; // Exit the function if the user is not the owner
        }

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
    return <Loading />;
  }

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Articles</h1>

      {/* Search Bar and Filter Button */}
      <div className="flex items-center mb-4">
        <SearchBar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <button
          onClick={() => setShowFilterMenu(!showFilterMenu)}
          className="p-2 ml-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          <FaFilter />
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
        />
      )}

      {/* Article List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            handleContextMenuToggle={handleContextMenuToggle}
            contextMenu={contextMenu}
            toggleArticleStatus={toggleArticleStatus}
            archiveArticle={archiveArticle}
            deleteArticle={deleteArticle}
            currentUser={currentUser}
          />
        ))}
      </div>
    </div>
  );
}

export default ArticleList;
