import React, { useState, useEffect } from "react";
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

function ArticleDetail() {
  const { id } = useParams();
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
  const [tagSuggestions, setTagSuggestions] = useState([]); // Tags from Firestore
  const [showTagDropdown, setShowTagDropdown] = useState(false); // Toggle dropdown visibility

  useEffect(() => {
    const fetchArticle = async () => {
      setLoading(true);
      setError("");
      try {
        const articleRef = doc(db, "articles", id);
        const articleSnapshot = await getDoc(articleRef);

        if (articleSnapshot.exists()) {
          const articleData = articleSnapshot.data();
          setArticle(articleData);
          setTitle(articleData.title || "");
          setTags(articleData.tags?.join(", ") || "");
          setStatus(articleData.status || "UNREAD");
          setNotes(articleData.note || "");
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
    fetchTags(); // Fetch tags from Firestore
  }, [id]);

  // Function to save metadata changes to Firestore
  const saveMetadata = async () => {
    try {
      setSaving(true);
      const articleRef = doc(db, "articles", id);
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag); // Remove empty tags

      // Update the article with new metadata
      await updateDoc(articleRef, {
        title,
        tags: tagArray,
        status,
      });

      // Add new tags to the 'tags' collection if they don't exist
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

  // Function to handle metadata change
  const handleMetadataChange = (field, value) => {
    if (field === "title") setTitle(value);
    if (field === "tags") {
      const formattedTags = value.replace(/^,?\s*/, ""); // Remove leading ", " if present
      setTags(formattedTags);
    }
    if (field === "status") setStatus(value);
  };

  // Function to handle tag selection from dropdown
  const handleTagSelect = (tag) => {
    const currentTags = tags.split(",").map((tag) => tag.trim());
    if (!currentTags.includes(tag)) {
      const updatedTags = [...currentTags, tag].filter((t) => t).join(", "); // Remove empty tags
      setTags(updatedTags);
    }
  };

  // Function to handle notes change
  const handleNotesChange = ({ text }) => {
    setNotes(text);
    saveNotes(text);
  };

  // Function to save notes to Firestore
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
    return <p>Loading article...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
      >
        <FaArrowLeft className="mr-2" /> Back
      </button>

      {article && (
        <div>
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold mb-2">
              {editing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) =>
                    handleMetadataChange("title", e.target.value)
                  }
                  className="w-full p-2 border rounded"
                />
              ) : (
                title
              )}
            </h1>
            <button
              onClick={() => {
                if (editing) {
                  saveMetadata(); // Save metadata when exiting edit mode
                }
                setEditing(!editing);
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {editing ? "Save" : "Edit"}
            </button>
          </div>

          <p className="text-sm text-gray-500 mb-4">{article.source}</p>

          {/* Metadata Fields */}
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
                  />
                  <div className="relative mt-2">
                    <button
                      className="flex items-center px-2 py-1 bg-gray-200 rounded hover:bg-gray-300"
                      onClick={() => setShowTagDropdown(!showTagDropdown)}
                    >
                      <FaPlus className="mr-1" /> Add from suggestions
                    </button>
                    {showTagDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-48 overflow-y-auto">
                        {tagSuggestions.map((suggestion, index) => (
                          <button
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
            className="prose mb-4"
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
            />
            {/* Save Status Indicator */}
            <div className="text-sm text-gray-500 mt-2">
              {saving ? "Saving..." : "Saved"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleDetail;
