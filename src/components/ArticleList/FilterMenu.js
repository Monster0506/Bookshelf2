import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchUserFolders } from "../../utils/firestoreUtils";
import { useAuth } from "../../contexts/AuthContext";
import "../../css/FilterMenu.css"; // Custom CSS for styles

function FilterMenu({
  statusFilter,
  setStatusFilter,
  fileTypeFilter,
  setFileTypeFilter,
  tagFilter,
  setTagFilter,
  publicFilter,
  setPublicFilter,
  archiveFilter,
  setArchiveFilter,
  sortOption,
  setSortOption,
  dateRange,
  setDateRange,
  readingTimeRange,
  setReadingTimeRange,
  wordCountRange,
  setWordCountRange,
  folderFilter,
  setFolderFilter,
}) {
  const { currentUser } = useAuth();
  const [folders, setFolders] = useState([]);

  useEffect(() => {
    const loadFolders = async () => {
      if (currentUser) {
        const userFolders = await fetchUserFolders(currentUser.uid);
        setFolders(userFolders);
      }
    };
    loadFolders();
  }, [currentUser]);

  // Variants for staggered animations and slide-in effect
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
        staggerChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } },
  };

  return (
    <motion.div
      className="p-6 mb-6 bg-white border rounded-lg shadow-lg space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Folder Filter */}
        <motion.select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="p-3 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.03,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.2 }}
          variants={itemVariants}
        >
          <option value="">All Folders</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </motion.select>

        {/* Status Filter */}
        <motion.select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-3 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.03,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.2 }}
          variants={itemVariants}
        >
          <option value="">All Statuses</option>
          <option value="READ">Read</option>
          <option value="UNREAD">Unread</option>
        </motion.select>

        {/* File Type Filter */}
        <motion.select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="p-3 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.03,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.2 }}
          variants={itemVariants}
        >
          <option value="">All File Types</option>
          <option value="URL">URL</option>
          <option value="PDF">PDF</option>
          <option value="HTML">HTML</option>
          <option value="PLAINTEXT">Plaintext</option>
        </motion.select>

        {/* Tag Filter */}
        <motion.input
          type="text"
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="p-3 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.03,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.2 }}
          variants={itemVariants}
        />

        {/* Date Range Filter */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange?.from || ""}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 w-1/2"
            />
            <input
              type="date"
              value={dateRange?.to || ""}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 w-1/2"
            />
          </div>
        </motion.div>

        {/* Reading Time Range Filter */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-700">Reading Time (minutes)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={readingTimeRange?.min || ""}
              onChange={(e) => setReadingTimeRange(prev => ({ ...prev, min: e.target.value }))}
              className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 w-1/2"
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={readingTimeRange?.max || ""}
              onChange={(e) => setReadingTimeRange(prev => ({ ...prev, max: e.target.value }))}
              className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 w-1/2"
            />
          </div>
        </motion.div>

        {/* Word Count Range Filter */}
        <motion.div className="space-y-2" variants={itemVariants}>
          <label className="block text-sm font-medium text-gray-700">Word Count</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={wordCountRange?.min || ""}
              onChange={(e) => setWordCountRange(prev => ({ ...prev, min: e.target.value }))}
              className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 w-1/2"
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={wordCountRange?.max || ""}
              onChange={(e) => setWordCountRange(prev => ({ ...prev, max: e.target.value }))}
              className="p-2 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 w-1/2"
            />
          </div>
        </motion.div>

        {/* Public Filter */}
        <motion.label
          className="flex items-center space-x-3"
          whileHover={{
            scale: 1.02,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.2 }}
          variants={itemVariants}
        >
          <input
            type="checkbox"
            checked={publicFilter}
            onChange={(e) => setPublicFilter(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-700">Public Only</span>
        </motion.label>

        {/* Archive Filter */}
        <motion.label
          className="flex items-center space-x-3"
          whileHover={{
            scale: 1.02,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.2 }}
          variants={itemVariants}
        >
          <input
            type="checkbox"
            checked={archiveFilter}
            onChange={(e) => setArchiveFilter(e.target.checked)}
            className="h-5 w-5 rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-gray-700">Show Archived</span>
        </motion.label>

        {/* Sort Option */}
        <motion.select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-3 border rounded-lg bg-gray-100 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.03,
            boxShadow: "0 6px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.2 }}
          variants={itemVariants}
        >
          <option value="date">Sort by Date</option>
          <option value="title">Sort by Title</option>
          <option value="readingTime">Sort by Reading Time</option>
        </motion.select>
      </motion.div>
    </motion.div>
  );
}

export default FilterMenu;
