import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  addArticle,
  fetchUserFolders,
  updateFolderWithArticle,
} from "../utils/firestoreUtils";
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
  const [tags, setTags] = useState([""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const dropdownRef = React.createRef(null);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!currentUser) return;
      try {
        const userFolders = await fetchUserFolders(currentUser.uid);
        console.log("Received folder data:", userFolders);
        setFolders(userFolders);
      } catch (error) {
        console.error("Error fetching folders:", error);
      }
    };
    fetchFolders();
  }, [currentUser]);

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderId)) {
        newSet.delete(folderId);
      } else {
        newSet.add(folderId);
      }
      return newSet;
    });
  };

  // Render a single folder item
  const FolderItem = ({ folder }) => {
    const isExpanded = expandedFolders.has(folder.id);
    const hasChildren = folder.children && folder.children.length > 0;
    const isSelected = selectedFolder === folder.id;

    return (
      <div>
        <div
          className={`flex items-center px-4 py-2 cursor-pointer transition-colors duration-150 
            ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => {
            setSelectedFolder(folder.id);
            setIsDropdownOpen(false);
          }}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="mr-2 p-1 hover:bg-gray-200 rounded"
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'transform rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
            {!hasChildren && <div className="w-6" />}
            <div className="flex items-center">
              <svg
                className={`w-5 h-5 mr-2 ${hasChildren ? 'text-blue-500' : 'text-gray-500'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                />
              </svg>
              <span className="truncate">{folder.name}</span>
            </div>
          </div>
          {hasChildren && (
            <span className="text-xs text-gray-500 ml-2">
              ({folder.children.length})
            </span>
          )}
        </div>
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {folder.children.map((child) => (
              <FolderItem key={child.id} folder={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

      // URL Content Processing
      if (filetype === "URL") {
        try {
          console.log("Processing URL content...");
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
          console.log("Successfully processed URL content");
        } catch (contentError) {
          console.error("Failed to process URL content:", contentError);
          setError(
            `Failed to extract content from the URL. Please try a different URL. ${contentError}`,
          );
          return;
        }
      } else if ((filetype === "HTML" || filetype === "PDF") && file) {
        sourceURL = await uploadFileToStorage();
        try {
          console.log("Processing file content...");
          const {
            content,
            readingTime,
            wordCount,
            plaintext: extractedPlaintext,
          } = await fetchAndProcessContent(sourceURL);
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
          console.log("Successfully processed file content");
        } catch (contentError) {
          console.error("Failed to process file content:", contentError);
          setError(
            `Failed to extract content from the uploaded file. Please try again. ${contentError}`,
          );
          return;
        }
      } else if (filetype === "PLAINTEXT") {
        // Process plaintext input directly
        plaintext = source;
        articleContent = source; // Use the same content for markdown since it's plaintext
        const wordCount = source.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute
        autoTags = generateTags(plaintext);
        articleSummary = await summarizeContent(plaintext);
        readInfo = {
          text: source,
          minutes: readingTime.toString(),
          time: readingTime.toString(),
          summary: articleSummary,
          words: wordCount.toString(),
        };
        sourceURL = ""; // No URL for plaintext input
      }

      console.log("Selected folder:", selectedFolder);
      const folderName =
        folders.find((folder) => folder.id === selectedFolder)?.name || "";
      console.log("Folder name:", folderName);

      console.log("Adding article to database...");
      const result = await addArticle({
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
        folderId: selectedFolder,
        folderName,
      });

      if (!result || !result.id) {
        throw new Error("Failed to get article ID after creation");
      }

      const articleId = result.id;
      console.log("Article added successfully with ID:", articleId);

      // Update folder with the new article ID if a folder is selected
      if (selectedFolder) {
        console.log("Updating folder with article...");
        await updateFolderWithArticle(selectedFolder, articleId);
        console.log("Successfully updated folder");
      }

      setSuccess("Article added successfully!");
    } catch (error) {
      console.error("Failed to add article:", error);
      setError(`Failed to add article: ${error.message}`);
    }
  };

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen bg-gray-100"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <motion.div
        className="w-full max-w-2xl p-10 space-y-8 bg-white rounded-lg shadow-2xl"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 18 }}
      >
        <motion.h1
          className="text-4xl font-bold text-center text-blue-700"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 10 }}
        >
          Add New Article
        </motion.h1>
        {error && (
          <motion.p
            className="text-red-600 text-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {error}
          </motion.p>
        )}
        {success && (
          <motion.p
            className="text-green-600 text-center"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {success}
          </motion.p>
        )}
        <form onSubmit={handleAddArticle} className="space-y-6">
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 ease-in-out"
              required
            />
          </motion.div>
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <select
              value={filetype}
              onChange={(e) => setFiletype(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition duration-200 ease-in-out"
              required
            >
              <option value="URL">URL</option>
              <option value="PDF">PDF</option>
              <option value="HTML">HTML</option>
              <option value="PLAINTEXT">PLAINTEXT</option>
            </select>
          </motion.div>
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            {filetype === "URL" ? (
              <input
                type="text"
                placeholder="Source (URL)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 ease-in-out"
                required
              />
            ) : filetype === "PLAINTEXT" ? (
              <textarea
                type="text"
                placeholder="Source (PLAINTEXT)"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 ease-in-out"
                required
              />
            ) : (
              <input
                type="file"
                accept={filetype === "PDF" ? "application/pdf" : "text/html"}
                onChange={handleFileChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 ease-in-out"
                required
              />
            )}
          </motion.div>
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition duration-200 ease-in-out"
              required
            >
              <option value="READ">READ</option>
              <option value="UNREAD">UNREAD</option>
            </select>
          </motion.div>
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <input
              type="text"
              placeholder="Tags (comma-separated)"
              value={tags}
              onChange={(e) => {
                const tagsList = e.target.value.split(",");
                setTags(tagsList.map((tag) => tag.trim()));
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 ease-in-out"
            />
          </motion.div>
          <motion.div
            className="flex items-center"
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
          >
            <input
              type="checkbox"
              checked={publicStatus}
              onChange={(e) => setPublicStatus(e.target.checked)}
              className="mr-2 focus:ring-blue-600"
            />
            <label className="text-gray-800">Public</label>
          </motion.div>
          <motion.div
            className="mb-6 relative"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 15 }}
            ref={dropdownRef}
          >
            <label className="block text-lg font-medium mb-2">
              Select Folder
            </label>
            <div
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 bg-white transition-all duration-200 ease-in-out cursor-pointer flex items-center justify-between"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 mr-2 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                  />
                </svg>
                <span>
                  {selectedFolder
                    ? folders.find((folder) => folder.id === selectedFolder)?.name || "No Folder"
                    : "No Folder"}
                </span>
              </div>
              <svg
                className={`w-5 h-5 transform transition-transform duration-200 ${
                  isDropdownOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
            {isDropdownOpen && (
              <div className="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <div className="max-h-60 overflow-y-auto">
                  <div
                    className="py-2 hover:bg-gray-100 cursor-pointer px-4"
                    onClick={() => {
                      setSelectedFolder(null);
                      setIsDropdownOpen(false);
                    }}
                  >
                    No Folder
                  </div>
                  {folders.map((folder) => (
                    <FolderItem key={folder.id} folder={folder} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>
          <motion.button
            type="submit"
            className={`w-full py-3 text-white font-semibold rounded-md shadow-lg transition-transform duration-200 ease-in-out ${
              isUploading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 transform hover:scale-105"
            }`}
            disabled={isUploading}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {isUploading ? "Uploading..." : "Add Article"}
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AddArticle;
