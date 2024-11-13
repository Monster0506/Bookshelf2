import React from "react";
import { motion } from "framer-motion";
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
}) {
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
