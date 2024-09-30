import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { FaArrowLeft } from "react-icons/fa";

function ArticleDetail() {
  const { id } = useParams(); // Get the article ID from the URL
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState(""); // State for article notes

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
          setNotes(articleData.note || ""); // Load existing notes if available
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

    fetchArticle();
  }, [id]);

  // Function to handle notes change
  const handleNotesChange = async (newNotes) => {
    setNotes(newNotes);
    try {
      const articleRef = doc(db, "articles", id);
      await updateDoc(articleRef, { note: newNotes }); // Update the note in Firestore
    } catch (error) {
      console.error("Error updating notes:", error);
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
          <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
          <p className="text-sm text-gray-500 mb-4">{article.source}</p>

          {/* Article Metadata */}
          <div className="mb-4">
            <p className="text-gray-700">
              Tags: {article.tags?.join(", ") || "None"}
            </p>
            <p className="text-gray-700">Status: {article.status}</p>
            <p className="text-gray-700">
              Reading Time: {article.read?.minutes || "N/A"}
            </p>
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
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              className="w-full p-2 border rounded"
              rows="6"
              placeholder="Write your notes here..."
            ></textarea>
          </div>
        </div>
      )}
    </div>
  );
}

export default ArticleDetail;
