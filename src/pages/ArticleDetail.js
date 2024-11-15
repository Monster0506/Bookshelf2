import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebaseConfig";
import { useDebouncedCallback } from "use-debounce";
import NotesEditor from "../components/ArticleDetails/Content/NotesEditor";
import RelatedArticles from "../components/ArticleDetails/Content/RelatedArticles";
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
import { ActiveReadingProvider } from "../components/ArticleDetails/ActiveReading/ActiveReadingProvider";

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
  const [activeTab, setActiveTab] = useState("content");

  const tabs = [
    { id: "content", label: "Content" },
    { id: "notes", label: "Notes" },
    { id: "related", label: "Related Items" },
  ];

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
      } finally {
        setLoading(false);
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
      setSaving(true);
      const articleRef = doc(db, "articles", id);
      
      const tagArray = tags
        ? tags.split(",")
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0)
        : [];

      const updateData = {
        title: title || "",
        tags: tagArray,
        public: Boolean(isPublic),
        status: status || "",
        lastModified: new Date(),
      };

      if (folderId && folderName) {
        updateData.folderId = folderId;
        updateData.folderName = folderName;
      }

      await updateDoc(articleRef, updateData);

      const tagsCollection = collection(db, "tags");
      for (const tag of tagArray) {
        const tagDoc = doc(tagsCollection, tag);
        await setDoc(tagDoc, { 
          name: tag,
          lastUsed: new Date()
        }, { merge: true });
      }

      const updatedArticleDoc = await getDoc(articleRef);
      if (updatedArticleDoc.exists()) {
        const updatedArticle = { 
          id: updatedArticleDoc.id, 
          ...updatedArticleDoc.data() 
        };
        
        setArticle(updatedArticle);
        setTitle(updatedArticle.title || "");
        setTags(Array.isArray(updatedArticle.tags) ? updatedArticle.tags.join(", ") : "");
        setStatus(updatedArticle.status || "");
        setIsPublic(!!updatedArticle.public);
        setFolderId(updatedArticle.folderId || null);
        setFolderName(updatedArticle.folderName || null);
      }

      setSaving(false);
    } catch (error) {
      console.error("Error saving metadata:", error);
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
    <div className="min-h-screen bg-gray-50">
      <Header
        navigate={navigate}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tabs={tabs}
        showSidebar={showSidebar}
        setShowSidebar={setShowSidebar}
      />
      <div className="container mx-auto px-4 py-6 relative">
        <div className="flex flex-col lg:flex-row gap-6">
          {activeTab === "content" && (
            <div className={`flex-grow ${showSidebar ? "lg:w-2/3" : "w-full"}`}>
              <ActiveReadingProvider articleId={id}>
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
                  saveNotes={saveNotes}
                  setShowSummary={setShowSummary}
                  relatedArticles={relatedArticles}
                  canEdit={canEdit}
                  isPublic={isPublic}
                  setIsPublic={setIsPublic}
                  tagSuggestions={tagSuggestions}
                  setTagSuggestions={setTagSuggestions}
                  saving={saving}
                />
              </ActiveReadingProvider>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="flex-grow">
              <NotesEditor
                notes={notes}
                setNotes={setNotes}
                saveNotes={saveNotes}
                canEdit={canEdit}
                saving={saving}
              />
            </div>
          )}

          {activeTab === "related" && (
            <div className="flex-grow">
              <RelatedArticles relatedArticles={relatedArticles} />
            </div>
          )}

          {showSidebar && (
            <div className="w-96 sticky top-16">
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
      </div>
      <ScrollButton />
    </div>
  );
}

export default ArticleDetail;
