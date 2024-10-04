import React from "react";
import { CSSTransition, TransitionGroup } from "react-transition-group";
import "../../css/FilterMenu.css"; // Custom CSS for animations

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
    <div className="p-4 mb-4 bg-white border rounded shadow-md space-y-4 transition-transform duration-500 transform hover:scale-105">
      <TransitionGroup className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CSSTransition
          timeout={500}
          classNames="filter-item"
          key="status-filter"
        >
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="p-2 border rounded bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="READ">Read</option>
            <option value="UNREAD">Unread</option>
          </select>
        </CSSTransition>

        <CSSTransition
          timeout={500}
          classNames="filter-item"
          key="file-type-filter"
        >
          <select
            value={fileTypeFilter}
            onChange={(e) => setFileTypeFilter(e.target.value)}
            className="p-2 border rounded bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All File Types</option>
            <option value="URL">URL</option>
            <option value="PDF">PDF</option>
            <option value="HTML">HTML</option>
          </select>
        </CSSTransition>

        <CSSTransition timeout={500} classNames="filter-item" key="tag-filter">
          <input
            type="text"
            placeholder="Filter by tag"
            value={tagFilter}
            onChange={(e) => setTagFilter(e.target.value)}
            className="p-2 border rounded bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 focus:ring-2 focus:ring-blue-500"
          />
        </CSSTransition>

        <CSSTransition
          timeout={500}
          classNames="filter-item"
          key="public-filter"
        >
          <label className="flex items-center space-x-2 transition-transform duration-300 transform hover:scale-105">
            <input
              type="checkbox"
              checked={publicFilter}
              onChange={(e) => setPublicFilter(e.target.checked)}
              className="h-4 w-4 transition-transform duration-300 transform hover:scale-110 focus:ring-2 focus:ring-blue-500"
            />
            <span>Public Only</span>
          </label>
        </CSSTransition>

        <CSSTransition
          timeout={500}
          classNames="filter-item"
          key="archive-filter"
        >
          <label className="flex items-center space-x-2 transition-transform duration-300 transform hover:scale-105">
            <input
              type="checkbox"
              checked={archiveFilter}
              onChange={(e) => setArchiveFilter(e.target.checked)}
              className="h-4 w-4 transition-transform duration-300 transform hover:scale-110 focus:ring-2 focus:ring-blue-500"
            />
            <span>Show Archived</span>
          </label>
        </CSSTransition>

        <CSSTransition timeout={500} classNames="filter-item" key="sort-option">
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="p-2 border rounded bg-gray-100 transition duration-300 ease-in-out transform hover:scale-105 focus:ring-2 focus:ring-blue-500"
          >
            <option value="date">Sort by Date</option>
            <option value="title">Sort by Title</option>
            <option value="readingTime">Sort by Reading Time</option>
          </select>
        </CSSTransition>
      </TransitionGroup>
    </div>
  );
}

export default FilterMenu;
