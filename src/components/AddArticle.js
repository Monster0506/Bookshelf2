import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { addArticle } from "../utils/firestoreUtils";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../firebaseConfig";
import {
  fetchAndProcessContent,
  generateTags,
  summarizeContent,
} from "../utils/contentUtils";
import { processHTMLFile, processPDFFile } from "../utils/fileUtils";

function AddArticle() {
  const { currentUser } = useAuth();
  const [title, setTitle] = useState("");
  const [filetype, setFiletype] = useState("URL");
  const [publicStatus, setPublicStatus] = useState(false);
  const [source, setSource] = useState("");
  const [status, setStatus] = useState("UNREAD");
  const [tags, setTags] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const uploadFileToStorage = async () => {
    if (!file) return;

    const storageRef = ref(storage, `articles/${currentUser.uid}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        () => {
          setIsUploading(true);
        },
        (error) => {
          setIsUploading(false);
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            setIsUploading(false);
            resolve(downloadURL);
          });
        },
      );
    });
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!currentUser) {
      setError("You must be logged in to add an article.");
      return;
    }

    try {
      let sourceURL = source;
      let articleContent = "";
      let articleSummary = "";
      let plaintext = "";
      let readInfo = {
        text: "",
        minutes: "",
        time: "",
        words: "",
        summary: "",
      };
      let autoTags = [];

      if (filetype === "URL") {
        try {
          const {
            content,
            readingTime,
            wordCount,
            plaintext: extractedPlaintext,
          } = await fetchAndProcessContent(source);
          articleContent = content;
          plaintext = extractedPlaintext;
          autoTags = generateTags(plaintext);
          articleSummary = await summarizeContent(plaintext);
          readInfo = {
            text: content,
            minutes: readingTime,
            time: readingTime,
            summary: articleSummary,
            words: wordCount.toString(),
          };
        } catch (contentError) {
          setError(
            `Failed to extract content from the URL. Please try a different URL.${contentError}`,
          );
          return;
        }
      } else if (filetype === "HTML" && file) {
        const {
          content,
          readingTime,
          wordCount,
          plaintext: extractedPlaintext,
        } = await processHTMLFile(file);
        articleContent = content;
        plaintext = extractedPlaintext; // Get plaintext for tag generation
        autoTags = generateTags(plaintext);
        articleSummary = await summarizeContent(plaintext);
        readInfo = {
          text: content,
          minutes: readingTime,
          time: readingTime,
          words: wordCount.toString(),
        };
        sourceURL = await uploadFileToStorage();
      } else if (filetype === "PDF" && file) {
        const {
          content,
          readingTime,
          wordCount,
          plaintext: extractedPlaintext,
        } = await processPDFFile(file);
        articleContent = content;
        plaintext = extractedPlaintext; // Get plaintext for tag generation
        autoTags = generateTags(plaintext);
        articleSummary = summarizeContent(plaintext);

        readInfo = {
          text: content,
          minutes: readingTime,
          time: readingTime,
          words: wordCount.toString(),
        };
        sourceURL = await uploadFileToStorage();
      }

      // Add the article to Firestore
      await addArticle({
        title,
        filetype,
        public: publicStatus,
        source: sourceURL,
        status,
        tags,
        autoTags,
        userid: currentUser.uid,
        archived: false,
        markdown: articleContent,
        plaintext, // Store plaintext for future use
        read: readInfo,
        summary: articleSummary,
      });

      setSuccess("Article added successfully!");
    } catch (error) {
      setError("Failed to add article. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-lg p-8 space-y-6 bg-white rounded shadow-md">
        <h1 className="text-2xl font-bold text-center">Add Article</h1>
        {error && <p className="text-red-500">{error}</p>}
        {success && <p className="text-green-500">{success}</p>}
        <form onSubmit={handleAddArticle} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            />
          </div>
          <div>
            <select
              value={filetype}
              onChange={(e) => setFiletype(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            >
              <option value="URL">URL</option>
              <option value="PDF">PDF</option>
              <option value="HTML">HTML</option>
            </select>
          </div>
          <div>
            {filetype === "URL" ? (
              <input
                type="text"
                placeholder="Source (URL)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            ) : (
              <input
                type="file"
                accept={filetype === "PDF" ? "application/pdf" : "text/html"}
                onChange={handleFileChange}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
                required
              />
            )}
          </div>
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
              required
            >
              <option value="READ">READ</option>
              <option value="UNREAD">UNREAD</option>
            </select>
          </div>
          <div>
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring focus:border-blue-300"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={publicStatus}
              onChange={(e) => setPublicStatus(e.target.checked)}
              className="mr-2"
            />
            <label>Public</label>
          </div>
          <button
            type="submit"
            className={`w-full py-2 text-white rounded ${
              isUploading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
            disabled={isUploading}
          >
            {isUploading ? "Uploading..." : "Add Article"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddArticle;
