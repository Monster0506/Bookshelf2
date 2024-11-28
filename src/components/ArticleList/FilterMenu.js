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

  return (
    <motion.div
      className="p-6 mb-6 bg-white border border-gray-200 rounded-lg shadow-md"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Folder Filter */}
        <select
          value={folderFilter}
          onChange={(e) => setFolderFilter(e.target.value)}
          className="p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Folders</option>
          {folders.map((folder) => (
            <option key={folder.id} value={folder.id}>
              {folder.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="READ">Read</option>
          <option value="UNREAD">Unread</option>
        </select>

        {/* File Type Filter */}
        <select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All File Types</option>
          <option value="URL">URL</option>
          <option value="PDF">PDF</option>
          <option value="HTML">HTML</option>
          <option value="PLAINTEXT">Plaintext</option>
        </select>

        {/* Tag Filter */}
        <input
          type="text"
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* Date Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Date Range</label>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange?.from || ""}
              onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              className="p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2"
            />
            <input
              type="date"
              value={dateRange?.to || ""}
              onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              className="p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2"
            />
          </div>
        </div>

        {/* Reading Time Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Reading Time (minutes)</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={readingTimeRange?.min || ""}
              onChange={(e) => setReadingTimeRange(prev => ({ ...prev, min: e.target.value }))}
              className="p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2"
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={readingTimeRange?.max || ""}
              onChange={(e) => setReadingTimeRange(prev => ({ ...prev, max: e.target.value }))}
              className="p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2"
            />
          </div>
        </div>

        {/* Word Count Range Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Word Count</label>
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={wordCountRange?.min || ""}
              onChange={(e) => setWordCountRange(prev => ({ ...prev, min: e.target.value }))}
              className="p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2"
            />
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={wordCountRange?.max || ""}
              onChange={(e) => setWordCountRange(prev => ({ ...prev, max: e.target.value }))}
              className="p-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-1/2"
            />
          </div>
        </div>

        {/* Public Filter */}
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={publicFilter}
            onChange={(e) => setPublicFilter(e.target.checked)}
            className="h-5 w-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700">Public Only</span>
        </label>

        {/* Archive Filter */}
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={archiveFilter}
            onChange={(e) => setArchiveFilter(e.target.checked)}
            className="h-5 w-5 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
          />
          <span className="text-gray-700">Show Archived</span>
        </label>

        {/* Sort Option */}
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-3 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="title">Sort by Title</option>
          <option value="readingTime">Sort by Reading Time</option>
        </select>
      </div>
    </motion.div>
  );
}

export default FilterMenu;
