import React, { useState } from "react";
import { FaSearch } from "react-icons/fa";
import "../../css/SearchBar.css"; // Custom CSS for animations

function SearchBar({ searchQuery, setSearchQuery }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div
      className={`relative flex-grow transition-transform duration-300 transform ${
        isFocused ? "scale-95" : ""
      } hover:scale-95`}
    >
      <FaSearch
        className={`absolute left-3 top-2.5 text-gray-500 transition-transform duration-300 ${
          isFocused ? "animate-bounce" : ""
        }`}
      />
      <input
        type="text"
        placeholder="Search by title, content, or URL"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="w-full p-2 pl-10 border rounded transition-shadow duration-300 focus:shadow-glow"
      />
    </div>
  );
}

export default SearchBar;