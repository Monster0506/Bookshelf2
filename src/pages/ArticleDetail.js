import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { db } from "../firebaseConfig";
import { useDebouncedCallback } from "use-debounce";
import NotesEditor from "../components/ArticleDetails/Content/NotesEditor";
import RelatedArticles from "../components/ArticleDetails/Content/RelatedArticles";
import ArticleStats from "../components/ArticleDetails/Content/ArticleStats";
import SummaryTab from "../components/ArticleDetails/Content/SummaryTab";
import TabBar from "../components/ArticleDetails/TabBar";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";
import { findRelatedArticles } from "../utils/articleUtils";
import Header from "../components/ArticleDetails/Header";
import ContentSection from "../components/ArticleDetails/ContentSection";
import Sidebar from "../components/ArticleDetails/Sidebar";
import ScrollButton from "../components/ArticleDetails/ScrollButton";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";
import { ActiveReadingProvider } from "../components/ArticleDetails/ActiveReading/ActiveReadingProvider";
import { formatDistance, format } from "date-fns";

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
  const [archived, setArchived] = useState(false);
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
  const [highlights, setHighlights] = useState([]);
  const [marginNotes, setMarginNotes] = useState([]);
  const [highlightsLoading, setHighlightsLoading] = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);
  const [marginNotesLoading, setMarginNotesLoading] = useState(true);

  // Define tabs based on user permissions
  const tabs = useMemo(() => {
    const baseTabs = [
      { id: "content", label: "Content" },
      { id: "summary", label: "Summary" },
      { id: "stats", label: "Article Statistics" },
    ];

    // Only show notes and related items tabs if user can edit
    if (canEdit) {
      baseTabs.splice(
        2,
        0,
        { id: "notes", label: "Notes" },
        { id: "related", label: "Related Items" },
      );
    }

    return baseTabs;
  }, [canEdit]);

  // Redirect from protected tabs if user can't edit
  useEffect(() => {
    if (!canEdit && (activeTab === "notes" || activeTab === "related")) {
      setActiveTab("content");
    }
  }, [canEdit, activeTab]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        // Run all main fetch operations in parallel
        const [
          articleSnapshot,
          tagsSnapshot,
          highlightsSnapshot,
          notesSnapshot,
          marginNotesSnapshot,
        ] = await Promise.all([
          getDoc(doc(db, "articles", id)),
          getDocs(collection(db, "tags")),
          getDocs(
            query(collection(db, "highlights"), where("articleId", "==", id)),
          ),
          getDocs(query(collection(db, "notes"), where("articleId", "==", id))),
          getDocs(
            query(collection(db, "marginNotes"), where("articleId", "==", id)),
          ),
        ]);

        if (!articleSnapshot.exists()) {
          setError("Article not found.");
          setLoading(false);
          return;
        }

        const articleData = articleSnapshot.data();
        articleData.id = articleSnapshot.id;

        // Process article data
        setArticle(articleData);
        setTitle(articleData.title || "");
        setTags(
          Array.isArray(articleData.tags) ? articleData.tags.join(", ") : "",
        );
        setStatus(articleData.status || "");
        setArchived(articleData.archived || false);
        setIsPublic(articleData.public || false);
        setAutoTagSuggestions(articleData.autoTags || []);
        setCanEdit(currentUser && articleData.userid === currentUser.uid);
        setFolderId(articleData.folderId);
        setFolderName(articleData.folderName);

        // Process tags
        const tagsData = tagsSnapshot.docs.map((doc) => doc.data().name);
        setTagSuggestions(tagsData);

        // Process highlights asynchronously
        Promise.resolve().then(() => {
          const highlightsData = highlightsSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setHighlights(highlightsData);
          setHighlightsLoading(false);
        });

        // Process notes asynchronously
        Promise.resolve().then(() => {
          const notesData = notesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          // Combine all note contents if there are any
          const combinedNotes =
            notesData.length > 0
              ? notesData.map((note) => note.content || "").join("\n\n")
              : articleData.note || "";
          setNotes(combinedNotes);
          setNotesLoading(false);
        });

        // Process margin notes asynchronously
        Promise.resolve().then(() => {
          const marginNotesData = marginNotesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setMarginNotes(marginNotesData);
          setMarginNotesLoading(false);
        });

        // Fetch related articles asynchronously
        fetchRelatedArticles(articleData);
      } catch (err) {
        console.error("Error fetching article:", err);
        setError("Failed to load article.");
      } finally {
        setLoading(false);
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

    if (currentUser) {
      fetchData();
    }
  }, [id, currentUser]);

  const saveNotes = async (noteText) => {
    if (canEdit) {
      setSaving(true);
      try {
        const articleRef = doc(db, "articles", id);
        await updateDoc(articleRef, {
          note: noteText,
        });
        setArticle((prevArticle) => ({ ...prevArticle, note: noteText }));
        setNotes(noteText); // Update the notes state
      } catch (error) {
        console.error("Error saving notes:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const saveMetadata = useCallback(async () => {
    try {
      setSaving(true);
      const articleRef = doc(db, "articles", id);

      const tagArray = tags
        ? tags
            .split(",")
            .map((tag) => tag.trim())
            .filter((tag) => tag.length > 0)
        : [];

      const updateData = {
        title: title || "",
        tags: tagArray,
        public: Boolean(isPublic),
        status: status || "",
        archived: archived,
        lastModified: new Date(),
        folderId: folderId || null,
        folderName: folderName || null,
      };

      await updateDoc(articleRef, updateData);

      const tagsCollection = collection(db, "tags");
      for (const tag of tagArray) {
        const tagDoc = doc(tagsCollection, tag);
        await setDoc(
          tagDoc,
          {
            name: tag,
            lastUsed: new Date(),
          },
          { merge: true },
        );
      }

      const updatedArticleDoc = await getDoc(articleRef);
      if (updatedArticleDoc.exists()) {
        const updatedArticle = {
          id: updatedArticleDoc.id,
          ...updatedArticleDoc.data(),
        };

        setArticle(updatedArticle);
        setTitle(updatedArticle.title || "");
        setTags(
          Array.isArray(updatedArticle.tags)
            ? updatedArticle.tags.join(", ")
            : "",
        );
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
  }, [id, tags, title, isPublic, status, folderId, folderName, archived]);

  const debouncedSaveNotes = useDebouncedCallback(() => {
    setSaving(true);
    saveNotes(notes);
  }, 1000); // Save notes with a 1-second debounce delay

  if (loading) {
    return <Loading loading="Loading article..." />;
  }

  if (error) {
    return (
      <div>
        <ErrorComponent error={error} />
      </div>
    );
  }

  // Only render the entire UI when all components are loaded
  const allComponentsLoaded =
    !notesLoading && !highlightsLoading && !marginNotesLoading;

  if (!allComponentsLoaded) {
    return <Loading loading="Loading components..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ActiveReadingProvider articleId={id}>
        <div className="flex flex-col min-h-screen">
          <Header
            showSidebar={showSidebar}
            setShowSidebar={setShowSidebar}
            articleId={id}
            title={title}
            date={format(article.date.toDate(), "yyyy-MM-dd")}
          />
          <div className="container mx-auto px-4 py-6 relative">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-grow">
                {/* Only show tabs when all related data is loaded */}
                <TabBar
                  tabs={tabs}
                  activeTab={activeTab}
                  setActiveTab={setActiveTab}
                />
                <div className="bg-white rounded-lg shadow-sm">
                  <div className="p-4">
                    {activeTab === "content" && (
                      <>
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
                          setShowSummary={setShowSummary}
                          relatedArticles={relatedArticles}
                          canEdit={canEdit}
                          isPublic={isPublic}
                          setIsPublic={setIsPublic}
                          tagSuggestions={tagSuggestions}
                          setTagSuggestions={setTagSuggestions}
                          saving={saving}
                        />
                        <ScrollButton />
                      </>
                    )}
                    {activeTab === "summary" && (
                      <SummaryTab
                        article={article}
                        status={status}
                        tags={tags}
                        setTags={setTags}
                        saveMetadata={saveMetadata}
                        createdAt={createdAt}
                      />
                    )}
                    {activeTab === "notes" && !notesLoading && (
                      <div className="p-4">
                        <NotesEditor
                          notes={notes}
                          setNotes={setNotes}
                          saveNotes={saveNotes}
                          canEdit={canEdit}
                          saving={saving}
                          articleId={article.id}
                          articleTitle={article.title}
                        />
                      </div>
                    )}
                    {activeTab === "related" && (
                      <div className="flex-grow">
                        <RelatedArticles relatedArticles={relatedArticles} />
                      </div>
                    )}
                    {activeTab === "stats" && (
                      <div className="flex-grow">
                        <ArticleStats article={article} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {/* Only show sidebar when margin notes are loaded */}
              {showSidebar && !marginNotesLoading && (
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
                    archived={archived}
                    setArchived={setArchived}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </ActiveReadingProvider>
    </div>
  );
}

export default ArticleDetail;
