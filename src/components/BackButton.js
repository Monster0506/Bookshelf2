import React from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(-1)}
      className="
        group
        inline-flex items-center
        px-3 py-1.5
        text-sm
        text-gray-600 hover:text-gray-800
        bg-transparent hover:bg-gray-50
        rounded-md
        transition-all duration-150 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-gray-200
      "
    >
      <FaArrowLeft className="mr-1.5 text-gray-400 group-hover:text-gray-600 transition-colors duration-150" size={14} />
      <span>Back</span>
    </button>
  );
}

export default BackButton;
