// SearchBar.js
import React from "react";
import { FaSearch } from "react-icons/fa";

function SearchBar({ searchQuery, setSearchQuery }) {
  return (
    <div className="relative flex-grow">
      <FaSearch className="absolute left-3 top-2.5 text-gray-500" />
      <input
        type="text"
        placeholder="Search by title, content, or URL"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full p-2 pl-10 border rounded"
      />
    </div>
  );
}

export default SearchBar;
