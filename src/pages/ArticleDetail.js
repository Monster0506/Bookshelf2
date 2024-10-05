import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  setDoc,
} from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import MdEditor from "react-markdown-editor-lite";
import "react-markdown-editor-lite/lib/index.css";
import { FaArrowLeft, FaPlus } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import { format } from "date-fns";
import { findRelatedArticles } from "../utils/articleUtils";
import Loading from "../components/Loading";
import ErrorComponent from "../components/Error";

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
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
  const [showTagDropdown, setShowTagDropdown] = useState(false);
  const [showAutoTagDropdown, setShowAutoTagDropdown] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [createdAt, setCreatedAt] = useState(null);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [showSummary, setShowSummary] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError("");
      try {
        const articleRef = doc(db, "articles", id);
        const articleSnapshot = await getDoc(articleRef);
        const articlesSnapshot = await getDocs(collection(db, "articles"));
        const allArticles = articlesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (articleSnapshot.exists()) {
          const currentArticle = {
            id: articleSnapshot.id,
            ...articleSnapshot.data(),
          };
          const articleData = articleSnapshot.data();

          // Get related articles with similarity scores
          const [similarityScores, related] = findRelatedArticles(
            currentArticle,
            allArticles,
            5,
          );
          setRelatedArticles(
            related.map((article, index) => ({
              ...article,
              similarity: similarityScores[index],
            })),
          );

          const articleTags = Array.isArray(articleData.tags)
            ? articleData.tags
            : [];
          const articleAutoTags = Array.isArray(articleData.autoTags)
            ? articleData.autoTags
            : [];

          setArticle(articleData);
          setTitle(articleData.title || "");
          setTags(articleTags.join(", "));
          setStatus(articleData.status || "UNREAD");
          setNotes(articleData.note || "");
          setCreatedAt(articleData.date);
          setAutoTagSuggestions(articleAutoTags);

          setCanEdit(articleData.userid === currentUser.uid);
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
        const tagsCollection = collection(db, "tags");
        const tagsSnapshot = await getDocs(tagsCollection);
        const tagsList = tagsSnapshot.docs.map((doc) => doc.data().name);
        setTagSuggestions(tagsList);
      } catch (err) {
        console.error("Error fetching tags:", err);
      }
    };

    fetchArticle();
    fetchTags();
  }, [id, currentUser]);

  const saveMetadata = async () => {
    try {
      setSaving(true);
      const articleRef = doc(db, "articles", id);
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag);

      await updateDoc(articleRef, {
        title,
        tags: tagArray,
        status,
      });

      const tagsCollection = collection(db, "tags");
      for (const tag of tagArray) {
        const tagDoc = doc(tagsCollection, tag);
        await setDoc(tagDoc, { name: tag }, { merge: true });
      }

      setSaving(false);
      console.log("Metadata saved successfully.");
    } catch (error) {
      console.error("Error updating metadata:", error);
      setSaving(false);
    }
  };

  const handleMetadataChange = (field, value) => {
    if (field === "title") setTitle(value);
    if (field === "tags") {
      const formattedTags = value.replace(/^,?\s*/, "");
      setTags(formattedTags);
    }
    if (field === "status") setStatus(value);
  };

  const handleTagSelect = (tag) => {
    const currentTags = tags.split(",").map((tag) => tag.trim());
    if (!currentTags.includes(tag)) {
      const updatedTags = [...currentTags, tag].filter((t) => t).join(", ");
      setTags(updatedTags);
    }
  };

  const handleNotesChange = ({ text }) => {
    setNotes(text);
    saveNotes(text);
  };

  const saveNotes = async (newNotes) => {
    try {
      setSaving(true);
      const articleRef = doc(db, "articles", id);
      await updateDoc(articleRef, { note: newNotes });
      console.log("Notes saved successfully.");
      setSaving(false);
    } catch (error) {
      console.error("Error updating notes:", error);
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading>Loading...</Loading>;
  }

  if (error) {
    return <ErrorComponent>{error}</ErrorComponent>;
  }

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="flex items-center mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      {article && (
        <div>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {editing ? (
                  <input
                    type="text"
                    value={title}
                    onChange={(e) =>
                      handleMetadataChange("title", e.target.value)
                    }
                    className="w-full p-2 border rounded"
                    disabled={!canEdit}
                  />
                ) : (
                  title
                )}
              </h1>
              {createdAt && (
                <p className="text-sm text-gray-500">
                  Created: {format(new Date(createdAt.seconds * 1000), "PPp")}
                </p>
              )}
            </div>
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  if (editing) {
                    saveMetadata();
                  }
                  setEditing(!editing);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {editing ? "Save" : "Edit"}
              </button>
            )}
          </div>

          <Link to={article.source}>
            <p className="text-sm text-gray-500 mb-4">{article.source}</p>
          </Link>

          {/* Summary Section */}
          <div className="mb-4">
            <h2 className="text-2xl font-semibold mb-2">Summary</h2>
            {!showSummary ? (
              <button
                type="button"
                onClick={() => setShowSummary(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Show Summary
              </button>
            ) : (
              <p className="text-gray-700">
                {article.summary || "No summary available."}
              </p>
            )}
          </div>

          {/* Tags Section */}
          <div className="mb-4">
            <div className="mb-2">
              <label className="block text-gray-700">Tags:</label>
              {editing ? (
                <div className="relative">
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) =>
                      handleMetadataChange("tags", e.target.value)
                    }
                    className="w-full p-2 border rounded"
                    placeholder="Add tags, separated by commas"
                    disabled={!canEdit}
                  />
                  {canEdit && (
                    <>
                      {/* Button to Add from Existing Tags */}
                      <div className="relative mt-2">
                        <button
                          type="button"
                          className="flex items-center px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() => setShowTagDropdown(!showTagDropdown)}
                        >
                          <FaPlus className="mr-1" /> Add from Existing Tags
                        </button>
                        {showTagDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                            {tagSuggestions.map((suggestion, index) => (
                              <button
                                type="button"
                                key={index}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-200"
                                onClick={() => {
                                  handleTagSelect(suggestion);
                                  setShowTagDropdown(false);
                                }}
                              >
                                {suggestion}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Button to Add from Auto Tags */}
                      <div className="relative mt-2">
                        <button
                          type="button"
                          className="flex items-center px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                          onClick={() =>
                            setShowAutoTagDropdown(!showAutoTagDropdown)
                          }
                        >
                          <FaPlus className="mr-1" /> Add from Auto Tags
                        </button>
                        {showAutoTagDropdown && (
                          <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                            {autoTagSuggestions.map((autoTag, index) => (
                              <button
                                type="button"
                                key={index}
                                className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-200"
                                onClick={() => {
                                  handleTagSelect(autoTag);
                                  setShowAutoTagDropdown(false);
                                }}
                              >
                                {autoTag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.split(",").map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 text-xs font-medium text-white bg-blue-500 rounded-full"
                    >
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-2">
              <label className="block text-gray-700">Status:</label>
              {editing ? (
                <select
                  value={status}
                  onChange={(e) =>
                    handleMetadataChange("status", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                  disabled={!canEdit}
                >
                  <option value="READ">Read</option>
                  <option value="UNREAD">Unread</option>
                </select>
              ) : (
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    status === "READ"
                      ? "bg-green-500 text-white"
                      : "bg-gray-500 text-white"
                  }`}
                >
                  {status}
                </span>
              )}
            </div>
          </div>

          {/* Article Content - Render HTML */}
          <div
            className="prose mb-4 markdown-content"
            dangerouslySetInnerHTML={{
              __html: article.markdown || "No content available.",
            }}
          ></div>

          {/* Notes Section */}
          <div className="mt-4">
            <h2 className="text-2xl font-semibold mb-2">Notes</h2>
            <MdEditor
              value={notes}
              style={{ height: "300px" }}
              renderHTML={(text) => <ReactMarkdown>{text}</ReactMarkdown>}
              onChange={handleNotesChange}
              readOnly={!canEdit}
            />
            <div className="text-sm text-gray-500 mt-2">
              {saving ? "Saving..." : "Saved"}
            </div>
          </div>

          {!canEdit && (
            <ErrorComponent>
              You do not have permission to edit this article.
            </ErrorComponent>
          )}

          {/* Render related articles */}
          <div className="mt-6">
            <h2 className="text-2xl font-semibold mb-4">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <div
                  key={relatedArticle.id}
                  className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
                >
                  <a
                    href={`/articles/${relatedArticle.id}`}
                    className="text-blue-600 hover:underline text-lg font-medium block mb-2"
                  >
                    {relatedArticle.title}
                  </a>
                  <p className="text-sm text-gray-500">
                    Similarity Score:{" "}
                    {(relatedArticle.similarity * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleDetail;
