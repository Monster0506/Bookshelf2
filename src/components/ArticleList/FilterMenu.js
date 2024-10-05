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
        duration: 0.1,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.1 } },
  };

  return (
    <motion.div
      className="p-4 mb-4 bg-white border rounded shadow-md space-y-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <motion.select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded bg-gray-100 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.02,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.1 }}
          variants={itemVariants}
        >
          <option value="">All Statuses</option>
          <option value="READ">Read</option>
          <option value="UNREAD">Unread</option>
        </motion.select>

        <motion.select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="p-2 border rounded bg-gray-100 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.02,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.1 }}
          variants={itemVariants}
        >
          <option value="">All File Types</option>
          <option value="URL">URL</option>
          <option value="PDF">PDF</option>
          <option value="HTML">HTML</option>
        </motion.select>

        <motion.input
          type="text"
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="p-2 border rounded bg-gray-100 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.02,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.1 }}
          variants={itemVariants}
        />

        <motion.label
          className="flex items-center space-x-2 "
          whileHover={{
            scale: 1.02,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.1 }}
          variants={itemVariants}
        >
          <input
            type="checkbox"
            checked={publicFilter}
            onChange={(e) => setPublicFilter(e.target.checked)}
            className="h-4 w-4 focus:ring-2 focus:ring-blue-500"
          />
          <span>Public Only</span>
        </motion.label>

        <motion.label
          className="flex items-center space-x-2"
          whileHover={{
            scale: 1.02,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          transition={{ duration: 0.1 }}
          variants={itemVariants}
        >
          <input
            type="checkbox"
            checked={archiveFilter}
            onChange={(e) => setArchiveFilter(e.target.checked)}
            className="h-4 w-4 focus:ring-2 focus:ring-blue-500"
          />
          <span>Show Archived</span>
        </motion.label>

        <motion.select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border rounded bg-gray-100 focus:ring-2 focus:ring-blue-500"
          whileHover={{
            scale: 1.02,
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.1)",
          }}
          whileFocus={{ scale: 1.02 }}
          transition={{ duration: 0.1 }}
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
