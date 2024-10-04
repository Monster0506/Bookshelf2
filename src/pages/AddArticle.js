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
import { motion } from "framer-motion";

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
            `Failed to extract content from the URL. Please try a different URL. ${contentError}`,
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
        plaintext = extractedPlaintext;
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
        plaintext = extractedPlaintext;
        autoTags = generateTags(plaintext);
        articleSummary = await summarizeContent(plaintext);

        readInfo = {
          text: content,
          minutes: readingTime,
          time: readingTime,
          words: wordCount.toString(),
        };
        sourceURL = await uploadFileToStorage();
      }

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
        plaintext,
        read: readInfo,
        summary: articleSummary,
      });

      setSuccess("Article added successfully!");
    } catch (error) {
      setError("Failed to add article. Please try again.");
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 to-purple-100"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className="w-full max-w-lg p-8 space-y-6 bg-white rounded-2xl shadow-lg"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, duration: 0.5 }}
      >
        <motion.h1
          className="text-3xl font-bold text-center text-purple-700"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          Add Article
        </motion.h1>
        {error && (
          <motion.p
            className="text-red-500 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            className="text-green-500 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            {success}
          </motion.p>
        )}
        <form onSubmit={handleAddArticle} className="space-y-4">
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </motion.div>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <select
              value={filetype}
              onChange={(e) => setFiletype(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              required
            >
              <option value="URL">URL</option>
              <option value="PDF">PDF</option>
              <option value="HTML">HTML</option>
            </select>
          </motion.div>
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {filetype === "URL" ? (
              <input
                type="text"
                placeholder="Source (URL)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            ) : (
              <input
                type="file"
                accept={filetype === "PDF" ? "application/pdf" : "text/html"}
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            )}
          </motion.div>
          <motion.div
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              required
            >
              <option value="READ">READ</option>
              <option value="UNREAD">UNREAD</option>
            </select>
          </motion.div>
          <motion.div
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </motion.div>
          <motion.div
            className="flex items-center"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <input
              type="checkbox"
              checked={publicStatus}
              onChange={(e) => setPublicStatus(e.target.checked)}
              className="mr-2 focus:ring-purple-500"
            />
            <label className="text-gray-700">Public</label>
          </motion.div>
          <motion.button
            type="submit"
            className={`w-full py-3 text-white rounded-lg shadow-md transition-transform duration-300 ${
              isUploading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-purple-600 hover:bg-purple-700 transform hover:scale-105"
            }`}
            disabled={isUploading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isUploading ? "Uploading..." : "Add Article"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AddArticle;
