// FilterMenu.js
import React from "react";

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
  return (
    <div className="p-4 mb-4 bg-white border rounded shadow-md space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="p-2 border rounded bg-gray-100"
        >
          <option value="">All Statuses</option>
          <option value="READ">Read</option>
          <option value="UNREAD">Unread</option>
        </select>

        <select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="p-2 border rounded bg-gray-100"
        >
          <option value="">All File Types</option>
          <option value="URL">URL</option>
          <option value="PDF">PDF</option>
          <option value="HTML">HTML</option>
        </select>

        <input
          type="text"
          placeholder="Filter by tag"
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="p-2 border rounded bg-gray-100"
        />

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={publicFilter}
            onChange={(e) => setPublicFilter(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Public Only</span>
        </label>

        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={archiveFilter}
            onChange={(e) => setArchiveFilter(e.target.checked)}
            className="h-4 w-4"
          />
          <span>Show Archived</span>
        </label>

        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="p-2 border rounded bg-gray-100"
        >
          <option value="date">Sort by Date</option>
          <option value="title">Sort by Title</option>
          <option value="readingTime">Sort by Reading Time</option>
        </select>
      </div>
    </div>
  );
}

export default FilterMenu;
