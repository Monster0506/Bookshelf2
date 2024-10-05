import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import BackButton from "../BackButton";

function Header({ navigate, showSidebar, setShowSidebar }) {
  return (
    <div className="flex items-center justify-between mb-8">
      <BackButton />
      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition duration-300"
      >
        {showSidebar ? "Hide Metadata" : "Show Metadata"}
      </button>
    </div>
  );
}

export default Header;
