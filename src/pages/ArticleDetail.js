import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebaseConfig";
import { useDebouncedCallback } from "use-debounce";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { findRelatedArticles } from "../utils/articleUtils";
import Header from "../components/ArticleDetails/Header";
import ContentSection from "../components/ArticleDetails/ContentSection";
import Sidebar from "../components/ArticleDetails/Sidebar";
import ScrollButton from "../components/ArticleDetails/ScrollButton";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";

function ArticleDetail() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [tagSuggestions, setTagSuggestions] = useState([]);
  const [autoTagSuggestions, setAutoTagSuggestions] = useState([]);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [createdAt, setCreatedAt] = useState(null);
  const [folderId, setFolderId] = useState(null);
  const [folderName, setFolderName] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [isPublic, setIsPublic] = useState(false);
  const [canEdit, setCanEdit] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError("");
      try {
        const articleRef = doc(db, "articles", id);
        const articleSnapshot = await getDoc(articleRef);

        if (articleSnapshot.exists()) {
          const articleData = articleSnapshot.data();
          articleData.id = articleSnapshot.id;
          setArticle(articleData);
          setTitle(articleData.title || "");
          setTags(
            Array.isArray(articleData.tags) ? articleData.tags.join(", ") : "",
          );
          setStatus(articleData.status || "UNREAD");
          setNotes(articleData.note || "");
          setCreatedAt(articleData.date);
          setIsPublic(articleData.public || false);
          setAutoTagSuggestions(articleData.autoTags || []);
          setCanEdit(currentUser && articleData.userid === currentUser.uid);
          setFolderId(articleData.folderId);
          setFolderName(articleData.folderName);

          // Fetch related articles after loading the main article
          fetchRelatedArticles(articleData);
        } else {
          setError("Article not found.");
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article.");
      } finally {
        setLoading(false);
      }
    };
    const fetchTags = async () => {
      try {
        const tagsSnapshot = await getDocs(collection(db, "tags"));
        const tagsData = tagsSnapshot.docs.map((doc) => doc.data().name);
        setTagSuggestions(tagsData);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    const fetchRelatedArticles = async (currentArticle) => {
      try {
        const articlesSnapshot = await getDocs(collection(db, "articles"));
        const allArticles = articlesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const filteredArticles = allArticles.filter((article) => {
          return (
            article.public ||
            (currentUser && article.userid === currentUser.uid)
          );
        });

        const [similarityScores, related] = findRelatedArticles(
          currentArticle,
          filteredArticles,
          5,
        );
        setRelatedArticles(
          related.map((article, index) => ({
            ...article,
            similarity: similarityScores[index],
          })),
        );
      } catch (err) {
        console.error("Error fetching related articles:", err);
      }
    };

    fetchTags();
    fetchArticle();
  }, [id, currentUser]);

  const saveNotes = async () => {
    if (notes && canEdit) {
      try {
        const articleRef = doc(db, "articles", id);
        await updateDoc(articleRef, {
          note: notes,
        });
        setArticle((prevArticle) => ({ ...prevArticle, note: notes }));
        console.log("Notes saved successfully.");
      } catch (error) {
        console.error("Error saving notes:", error);
      } finally {
        setSaving(false); // Reset saving state
      }
    }
  };

  const saveMetadata = useCallback(async () => {
    try {
      console.log("Saving metadata...");
      setSaving(true);
      const articleRef = doc(db, "articles", id);
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      await updateDoc(articleRef, {
        title,
        tags: tagArray,
        public: isPublic,
        folderId: folderId,
        folderName: folderName,
        status,
      });

      const tagsCollection = collection(db, "tags");
      for (const tag of tagArray) {
        const tagDoc = doc(tagsCollection, tag);
        await setDoc(tagDoc, { name: tag }, { merge: true });
      }

      setSaving(false);
      console.log("Metadata saved successfully.");
      // get the new article:
    } catch (error) {
      console.error("Error updating metadata:", error);
      setSaving(false);
    }
  }, [id, tags, title, isPublic, status, folderId, folderName]);

  const debouncedSaveNotes = useDebouncedCallback(() => {
    setSaving(true);
    saveNotes();
  }, 1000); // Save notes with a 1-second debounce delay
  if (loading) {
    return <Loading loading="Loading ..." />;
  }

  if (error) {
    return (
      <div>
        <ErrorComponent error={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-5">
      <Header
        navigate={navigate}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />
      <div className="flex flex-col lg:flex-row gap-5">
        {/* Content Section */}
        <div className={`flex-grow ${showSidebar ? "lg:w-2/3" : "w-full"}`}>
          <ContentSection
            article={article}
            title={title}
            setTitle={setTitle}
            notes={notes}
            setNotes={setNotes}
            editing={editing}
            setEditing={setEditing}
            status={status}
            setStatus={setStatus}
            tags={tags}
            setTags={setTags}
            createdAt={createdAt}
            showSummary={showSummary}
            saveNotes={debouncedSaveNotes}
            setShowSummary={setShowSummary}
            relatedArticles={relatedArticles}
            canEdit={canEdit}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            tagSuggestions={tagSuggestions}
            setTagSuggestions={setTagSuggestions}
            saving={saving}
          />
        </div>

        {/* Sidebar Section */}
        {showSidebar && (
          <div className="lg:w-1/3 w-full">
            <Sidebar
              article={article}
              tags={tags}
              setTags={setTags}
              status={status}
              setStatus={setStatus}
              isPublic={isPublic}
              setIsPublic={setIsPublic}
              editing={editing}
              setEditing={setEditing}
              canEdit={canEdit}
              folderId={folderId}
              setFolderId={setFolderId}
              folderName={folderName}
              setFolderName={setFolderName}
              tagSuggestions={tagSuggestions}
              autoTagSuggestions={autoTagSuggestions}
              saveMetadata={saveMetadata}
              showSidebar={showSidebar}
              saving={saving}
            />
          </div>
        )}
      </div>
      {/* Scroll Button */}
      <ScrollButton />
    </div>
  );
}

export default ArticleDetail;
