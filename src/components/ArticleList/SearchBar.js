import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "../../css/SearchBar.css"; // Custom CSS for animations

function SearchBar({ searchQuery, setSearchQuery }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="relative flex-grow">
      <input
        type="text"
        placeholder="Search articles..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full p-3 pl-12 border border-gray-300 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
      />
      <FaSearch
        className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500"
      />
    </div>
  );
}

export default SearchBar;
