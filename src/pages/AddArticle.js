import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
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
import { motion, AnimatePresence } from "framer-motion";
import { logArticleAdd, logError, logFeatureUse } from "../utils/analyticsUtils";

function AddArticle() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Combined form state
  const [formData, setFormData] = useState({
    title: "",
    filetype: "URL",
    publicStatus: false,
    source: "",
    status: "UNREAD",
    tags: [],
    file: null,
    selectedFolder: null
  });

  // Error states
  const [errors, setErrors] = useState({
    title: "",
    source: "",
    upload: "",
    processing: "",
    submission: ""
  });

  // Loading states
  const [loading, setLoading] = useState({
    foldersFetch: false,
    contentProcess: false,
    upload: false,
    submission: false
  });

  // UI states
  const [success, setSuccess] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [preview, setPreview] = useState({
    content: "",
    readingTime: 0,
    wordCount: 0
  });
  const [recentUrls, setRecentUrls] = useState([]);
  const [folders, setFolders] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState(new Set());
  const [showCancelModal, setShowCancelModal] = useState(false);
  const dropdownRef = React.createRef();

  // Load recent URLs from localStorage
  useEffect(() => {
    const loadRecentUrls = async () => {
      const urls = localStorage.getItem('recentUrls');
      if (urls) setRecentUrls(JSON.parse(urls));
    };
    loadRecentUrls();
  }, []);

  // Save URL to recent history
  const saveToRecent = (url) => {
    const updated = [url, ...recentUrls.filter(u => u !== url)].slice(0, 5);
    setRecentUrls(updated);
    localStorage.setItem('recentUrls', JSON.stringify(updated));
  };

  // Form change handler
  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear related error when field changes
    setErrors(prev => ({ ...prev, [field]: "" }));
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.source.trim() && formData.filetype === "URL") newErrors.source = "URL is required";
    if (!formData.file && ["HTML", "PDF"].includes(formData.filetype)) newErrors.upload = "File is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      filetype: "URL",
      publicStatus: false,
      source: "",
      status: "UNREAD",
      tags: [],
      file: null,
      selectedFolder: null
    });
    setErrors({});
    setPreview({ content: "", readingTime: 0, wordCount: 0 });
    setUploadProgress(0);
    setSuccess("");
    setIsDropdownOpen(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    setShowCancelModal(false);
    resetForm();
    navigate(-1);
  };

  // Preview content
  const handlePreview = async () => {
    try {
      setLoading(prev => ({ ...prev, contentProcess: true }));
      
      if (formData.filetype === "PLAINTEXT") {
        // Handle plaintext preview directly
        const lines = formData.source.split('\n');
        const truncatedLines = lines.slice(0, 5);
        const content = truncatedLines.join('<br>') + (lines.length > 5 ? '<br>...' : '');
        const wordCount = formData.source.trim().split(/[\s\n]+/).filter(word => word.length > 0).length;
        const readingTime = Math.ceil(wordCount / 200);
        setPreview({ content, readingTime, wordCount });
      } else {
        // Handle URL and file content
        const { content, readingTime, wordCount } = await fetchAndProcessContent(formData.source);
        // Truncate HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.textContent || tempDiv.innerText;
        const lines = text.split('\n');
        const truncatedLines = lines.slice(0, 2);
        const truncatedContent = truncatedLines.join('<br>') + (lines.length > 5 ? '<br>...' : '');
        setPreview({ content: truncatedContent, readingTime, wordCount });
      }
    } catch (error) {
      setErrors(prev => ({ ...prev, processing: error.message }));
    } finally {
      setLoading(prev => ({ ...prev, contentProcess: false }));
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleAddArticle(e);
            break;
          case 'p':
            e.preventDefault();
            handlePreview();
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [formData]);

  useEffect(() => {
    const fetchFolders = async () => {
      if (!currentUser) return;
      try {
        setLoading(prev => ({ ...prev, foldersFetch: true }));
        const userFolders = await fetchUserFolders(currentUser.uid);
        setFolders(userFolders);
      } catch (error) {
        console.error("Error fetching folders:", error);
      } finally {
        setLoading(prev => ({ ...prev, foldersFetch: false }));
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
    const isSelected = formData.selectedFolder === folder.id;

    return (
      <div>
        <div
          className={`flex items-center px-4 py-2 cursor-pointer transition-colors duration-150 
            ${isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
          onClick={() => {
            handleFormChange('selectedFolder', folder.id);
            setIsDropdownOpen(false);
            logFeatureUse('select_folder', {
              folder_id: folder.id,
              context: 'article_add'
            });
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
    handleFormChange('file', e.target.files[0]);
  };

  const uploadFileToStorage = async () => {
    if (!formData.file) return;

    const storageRef = ref(storage, `articles/${currentUser.uid}/${formData.file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, formData.file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          reject(error);
        },
        () => {
          getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
            resolve(downloadURL);
          });
        },
      );
    });
  };

  const handleAddArticle = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess("");

    if (!currentUser) {
      setErrors({ submission: "You must be logged in to add an article." });
      return;
    }

    if (!validateForm()) return;

    try {
      setLoading(prev => ({ ...prev, submission: true }));
      logFeatureUse('start_article_add', { has_file: !!formData.file });

      let sourceURL = formData.source;
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
      if (formData.filetype === "URL") {
        try {
          const {
            content,
            readingTime,
            wordCount,
            plaintext: extractedPlaintext,
          } = await fetchAndProcessContent(formData.source);
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
          console.error("Failed to process URL content:", contentError);
          setErrors({ processing: `Failed to extract content from the URL. ${contentError}` });
          logError('article_add_error', `Failed to extract content from the URL. ${contentError}`, {
            has_file: !!formData.file,
            has_url: !!formData.source,
            has_folder: !!formData.selectedFolder
          });
          return;
        }
      } else if ((formData.filetype === "HTML" || formData.filetype === "PDF") && formData.file) {
        sourceURL = await uploadFileToStorage();
        try {
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
        } catch (contentError) {
          console.error("Failed to process file content:", contentError);
          setErrors({ processing: `Failed to extract content from the uploaded file. ${contentError}` });
          logError('article_add_error', `Failed to extract content from the uploaded file. ${contentError}`, {
            has_file: !!formData.file,
            has_url: !!formData.source,
            has_folder: !!formData.selectedFolder
          });
          return;
        }
      } else if (formData.filetype === "PLAINTEXT") {
        // Process plaintext input directly
        plaintext = formData.source;
        // Convert newlines to <br> tags for markdown display
        articleContent = formData.source.replace(/\n/g, '<br>');
        // Count words properly by splitting on whitespace and newlines
        const wordCount = formData.source.trim().split(/[\s\n]+/).filter(word => word.length > 0).length;
        const readingTime = Math.ceil(wordCount / 200); // Assuming 200 words per minute
        autoTags = generateTags(plaintext);
        articleSummary = await summarizeContent(plaintext);
        readInfo = {
          text: formData.source,
          minutes: readingTime.toString(),
          time: readingTime.toString(),
          summary: articleSummary,
          words: wordCount.toString(),
        };
        sourceURL = ""; // No URL for plaintext input
      }

      const folderName =
        folders.find((folder) => folder.id === formData.selectedFolder)?.name || "";

      const cleanedTags = formData.tags.map(tag => tag.trim()).filter(tag => tag !== '');

      const result = await addArticle({
        title: formData.title,
        filetype: formData.filetype,
        public: formData.publicStatus,
        source: sourceURL,
        status: formData.status,
        tags: cleanedTags,
        autoTags,
        userid: currentUser.uid,
        archived: false,
        markdown: articleContent,
        plaintext,
        read: readInfo,
        summary: articleSummary,
        folderId: formData.selectedFolder,
        folderName,
      });

      if (!result || !result.id) {
        throw new Error("Failed to get article ID after creation");
      }

      const articleId = result.id;

      // Track successful article addition
      logArticleAdd(articleId, formData.selectedFolder);

      // Update folder with the new article ID if a folder is selected
      if (formData.selectedFolder) {
        await updateFolderWithArticle(formData.selectedFolder, articleId);
      }

      setSuccess("Article added successfully!");
      resetForm();
      
      // Show a temporary success message at the bottom
      const successDiv = document.createElement('div');
      successDiv.className = 'fixed bottom-8 right-8 bg-green-500 text-white px-8 py-4 rounded-xl shadow-2xl text-lg font-bold transform transition-all duration-300 ease-out';
      successDiv.innerHTML = `
        <div class="flex items-center space-x-2">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Article Added Successfully!</span>
        </div>
      `;
      
      // Add initial transform
      successDiv.style.transform = 'translateY(100px)';
      document.body.appendChild(successDiv);
      
      // Trigger animation
      setTimeout(() => {
        successDiv.style.transform = 'translateY(0)';
      }, 10);
      
      // Remove with fade out animation
      setTimeout(() => {
        successDiv.style.transform = 'translateY(100px)';
        successDiv.style.opacity = '0';
        setTimeout(() => {
          document.body.removeChild(successDiv);
        }, 300);
      }, 2700);

    } catch (error) {
      console.error("Failed to add article:", error);
      setErrors({ submission: `Failed to add article: ${error.message}` });
      logError('article_add_error', error.message, {
        has_file: !!formData.file,
        has_url: !!formData.source,
        has_folder: !!formData.selectedFolder
      });
    } finally {
      setLoading(prev => ({ ...prev, submission: false }));
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
        {/* Cancel Confirmation Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white p-8 rounded-xl shadow-2xl max-w-md w-full mx-4"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <h2 className="text-2xl font-bold mb-4 text-gray-800">Confirm Cancel</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to cancel? All progress will be lost.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={confirmCancel}
                  className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200"
                >
                  Yes, Cancel
                </button>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors duration-200"
                >
                  No, Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <motion.h1
          className="text-4xl font-bold text-center text-blue-700"
          initial={{ scale: 0.85 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 140, damping: 10 }}
        >
          Add New Article
        </motion.h1>
        {Object.keys(errors).some(key => errors[key]) && (
          <motion.p
            className="text-red-600 text-center"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            {Object.values(errors).join(', ')}
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
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
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
              value={formData.filetype}
              onChange={(e) => handleFormChange('filetype', e.target.value)}
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
            {formData.filetype === "URL" ? (
              <input
                type="text"
                placeholder="Source (URL)"
                value={formData.source}
                onChange={(e) => handleFormChange('source', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 ease-in-out"
                required
              />
            ) : formData.filetype === "PLAINTEXT" ? (
              <textarea
                type="text"
                placeholder="Source (PLAINTEXT)"
                value={formData.source}
                onChange={(e) => handleFormChange('source', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 transition duration-200 ease-in-out"
                required
              />
            ) : (
              <input
                type="file"
                accept={formData.filetype === "PDF" ? "application/pdf" : "text/html"}
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
              value={formData.status}
              onChange={(e) => handleFormChange('status', e.target.value)}
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
              value={formData.tags.join(', ')}
              onChange={(e) => {
                const inputValue = e.target.value;
                const tags = inputValue === '' ? [''] : inputValue.split(',').map(tag => tag.trim());
                handleFormChange('tags', tags);
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
              checked={formData.publicStatus}
              onChange={(e) => handleFormChange('publicStatus', e.target.checked)}
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
                  {formData.selectedFolder
                    ? folders.find((folder) => folder.id === formData.selectedFolder)?.name || "No Folder"
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
                      handleFormChange('selectedFolder', null);
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
          {preview.content && (
            <motion.div
              className="mt-6 p-4 border border-gray-300 rounded-lg"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 15 }}
            >
              <div className="flex justify-between mb-2 text-sm text-gray-600">
                <span>Reading Time: {preview.readingTime}</span>
                <span>Word Count: {preview.wordCount}</span>
              </div>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: preview.content }}
              />
            </motion.div>
          )}
          <motion.button
            type="submit"
            className={`w-full py-3 text-white font-semibold rounded-md shadow-lg transition-transform duration-200 ease-in-out ${
              loading.submission
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 transform hover:scale-105"
            }`}
            disabled={loading.submission}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {loading.submission ? "Adding..." : "Add Article"}
          </motion.button>
          <motion.button
            type="button"
            className="w-full py-3 text-white font-semibold rounded-md shadow-lg transition-transform duration-200 ease-in-out bg-red-600 hover:bg-red-700 transform hover:scale-105"
            onClick={handleCancel}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            Cancel
          </motion.button>
        </form>
      </motion.div>
    </motion.div>
  );
}

export default AddArticle;
